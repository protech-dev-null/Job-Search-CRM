from fastapi.testclient import TestClient


def test_skills_are_normalized_and_listed(client: TestClient) -> None:
    """Share canonical skills across vacancies regardless of input casing."""
    first_response = client.post(
        "/api/vacancies",
        json={
            "company": "Orbit Labs",
            "position": "Frontend Developer",
            "skills": ["React", " react ", "TypeScript"],
        },
    )
    second_response = client.post(
        "/api/vacancies",
        json={
            "company": "CloudFox",
            "position": "UI Developer",
            "skills": ["REACT", "CSS"],
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert first_response.json()["skills"] == ["React", "TypeScript"]
    assert second_response.json()["skills"] == ["CSS", "React"]

    response = client.get("/api/skills?search=act")

    assert response.status_code == 200
    assert [skill["name"] for skill in response.json()] == ["React"]
