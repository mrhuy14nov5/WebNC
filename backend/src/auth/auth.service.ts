import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import { AuthSession, AuthUser, Student } from '../database/entities';

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const sessionSecret = process.env.SESSION_SECRET
  || (process.env.NODE_ENV === 'production' ? '' : randomBytes(32).toString('hex'));
if (!sessionSecret || (process.env.NODE_ENV === 'production' && sessionSecret.length < 32)) {
  throw new Error('A SESSION_SECRET with at least 32 characters is required in production.');
}

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  major: string;
  year: number;
  role: string;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password: string) {
  return { hash: await bcrypt.hash(password, 12), salt: '' };
}

async function hashLegacyPassword(password: string, salt: string) {
  const derivedKey = await scryptAsync(password, salt, 64);
  return derivedKey.toString('hex');
}

async function verifyPassword(password: string, storedHash: string, salt: string) {
  if (/^\$2[aby]\$/.test(storedHash)) return bcrypt.compare(password, storedHash);
  const hash = await hashLegacyPassword(password, salt);
  const actual = Buffer.from(hash, 'hex');
  const expected = Buffer.from(storedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createSessionToken(userId: number) {
  return jwt.sign({ sub: String(userId), jti: randomBytes(16).toString('hex') }, sessionSecret, {
    expiresIn: sessionLifetimeMs / 1000,
  });
}

@Injectable()
export class AuthService {
  constructor(private readonly dataSource: DataSource) {}

  private get users() {
    return this.dataSource.getRepository(AuthUser);
  }

  private get sessions() {
    return this.dataSource.getRepository(AuthSession);
  }

  private publicUser(user: AuthUser): PublicUser {
    return {
      id: user.id,
      name: user.student.name,
      email: user.student.email,
      major: user.student.major,
      year: user.student.year,
      role: user.role,
    };
  }

  private async upgradePasswordHash(userId: number, password: string) {
    const credentials = await hashPassword(password);
    await this.users.update(userId, { passwordHash: credentials.hash, passwordSalt: credentials.salt });
  }

  async register({ name, email, major, year, password }: { name: string; email: string; major: string; year: number; password: string }) {
    const credentials = await hashPassword(password);
    return this.dataSource.transaction(async (manager) => {
      const student = await manager.getRepository(Student).save({ name, email, major, year });
      const user = await manager.getRepository(AuthUser).save({
        studentId: student.id,
        email,
        passwordHash: credentials.hash,
        passwordSalt: credentials.salt,
        role: 'student',
      });
      const token = createSessionToken(user.id);
      await manager.getRepository(AuthSession).save({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: Date.now() + sessionLifetimeMs as any,
      });
      return {
        user: this.publicUser({ ...user, student }),
        token,
      };
    });
  }

  async login(email: string, password: string) {
    const account = await this.users.findOne({ where: { email }, relations: { student: true } });
    const valid = account
      ? await verifyPassword(password, account.passwordHash, account.passwordSalt)
      : await verifyPassword(password, '0'.repeat(128), '0'.repeat(32));
    if (!account || !valid) return null;
    if (!/^\$2[aby]\$/.test(account.passwordHash)) await this.upgradePasswordHash(account.id, password);

    const token = createSessionToken(account.id);
    await this.sessions.delete({ userId: account.id });
    await this.sessions.save({
      userId: account.id,
      tokenHash: hashToken(token),
      expiresAt: Date.now() + sessionLifetimeMs as any,
    });
    return { user: this.publicUser(account), token };
  }

  async findUserForSession(token: string): Promise<PublicUser | null> {
    let payload: any;
    try {
      payload = jwt.verify(token, sessionSecret, { algorithms: ['HS256'] });
    } catch {
      return null;
    }
    if (!payload || typeof payload !== 'object' || !payload.sub) return null;
    const session = await this.sessions.findOne({
      where: { tokenHash: hashToken(token) },
      relations: { user: { student: true } },
    });
    if (!session || Number(session.expiresAt) <= Date.now()) return null;
    if (!session.user || String(session.user.id) !== String(payload.sub)) return null;
    return this.publicUser(session.user);
  }

  async deleteSession(token: string) {
    await this.sessions.delete({ tokenHash: hashToken(token) });
  }

  async cleanupExpiredSessions() {
    await this.sessions.createQueryBuilder()
      .delete()
      .where('expires_at <= :now', { now: Date.now() })
      .execute();
  }

  async currentUser(token: string | null) {
    return token ? this.findUserForSession(token) : null;
  }

  assertAuthenticated(user: PublicUser | null): asserts user is PublicUser {
    if (!user) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
}
