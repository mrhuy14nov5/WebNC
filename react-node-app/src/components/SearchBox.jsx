import { useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { faculties } from '../data/mockData.js';

/** Search courses and sample student/class identifiers, then navigate to results. */
export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [faculty, setFaculty] = useState('Tất cả');
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (faculty !== 'Tất cả') params.set('faculty', faculty);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <Form className="search-panel" role="search" onSubmit={handleSubmit}>
      <Row className="g-2 align-items-stretch">
        <Col xs={12} lg={5}>
          <Form.Label htmlFor="site-search" className="visually-hidden">Tìm tên hoặc mã học phần</Form.Label>
          <InputGroup className="search-input-group">
            <InputGroup.Text><Search aria-hidden="true" /></InputGroup.Text>
            <Form.Control
              id="site-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên hoặc mã học phần"
              aria-label="Tìm tên hoặc mã học phần"
            />
          </InputGroup>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Form.Label htmlFor="faculty-select" className="visually-hidden">Khoa</Form.Label>
          <Form.Select id="faculty-select" value={faculty} onChange={(event) => setFaculty(event.target.value)} aria-label="Chọn khoa">
            {faculties.map((item) => <option key={item}>{item}</option>)}
          </Form.Select>
        </Col>
        <Col xs={12} lg={3}>
          <Button className="search-button w-100" type="submit">
            <Search className="me-2" aria-hidden="true" /> Tìm kiếm
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
