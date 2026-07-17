import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL || 'http://pm-alb-2089108845.ap-southeast-1.elb.amazonaws.com';
const loginUrl = `${baseUrl}/login`;
const patientUrl = `${baseUrl}/api/patients`;

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const patientsDuration = new Trend('patients_duration');

export let options = {
  stages: [
    { duration: '30s', target: 5 },    // Ramp up to 5 users
    { duration: '1m', target: 20 },    // Ramp to 20 users
    { duration: '2m', target: 20 },    // Stay at 20
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.05'],             // Error rate < 5%
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
  },
};

export default function () {
  // 1. Login
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

  // 2. Get patients list
  let patientsRes = http.get(patientUrl, { headers: authHeaders });
  patientsDuration.add(patientsRes.timings.duration);
  let patientsOk = check(patientsRes, {
    'patients status 200': (r) => r.status === 200,
  });
  errorRate.add(!patientsOk);

  sleep(1);
}