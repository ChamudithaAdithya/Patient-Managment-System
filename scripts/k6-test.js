import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'http://47.130.152.226';
const loginUrl = `${baseUrl}:4005/login`;
const patientUrl = `${baseUrl}:4004/api/patients`;

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const patientsDuration = new Trend('patients_duration');

export let options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  let loginRes = http.post(loginUrl, JSON.stringify({
    email: 'chamuditha@hospital.com',
    password: 'Admin@123',
  }), { headers: { 'Content-Type': 'application/json' } });

  loginDuration.add(loginRes.timings.duration);
  let loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });
  errorRate.add(!loginOk);

  if (!loginOk) {
    sleep(1);
    return;
  }

  let token = loginRes.json('token');
  let authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let patientsRes = http.get(patientUrl, { headers: authHeaders });
  patientsDuration.add(patientsRes.timings.duration);
  let patientsOk = check(patientsRes, {
    'patients status 200': (r) => r.status === 200,
  });
  errorRate.add(!patientsOk);

  sleep(1);
}
