import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Spin, message } from 'antd'
import { getById, create, update } from '../../api/doctors'
import { parseError } from '../../lib/errorHandler'
import type { DoctorRequest } from '../../types/doctor'

const { Title } = Typography

export default function DoctorForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (id) {
      getById(id)
        .then((d) => form.setFieldsValue(d))
        .finally(() => setFetching(false))
    }
  }, [id])

  const handleSubmit = async (values: DoctorRequest) => {
    setLoading(true)
    try {
      if (isEdit) {
        await update(id!, values)
        message.success('Doctor updated')
      } else {
        await create(values)
        message.success('Doctor created')
      }
      navigate('/doctors')
    } catch (err) {
      const parsed = parseError(err)
      if (parsed.fieldErrors) {
        const fields = Object.entries(parsed.fieldErrors).map(([name, msg]) => ({
          name,
          errors: [msg as string],
        }))
        form.setFields(fields)
      }
      message.error(parsed.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 16 }}>{isEdit ? 'Edit Doctor' : 'New Doctor'}</Title>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="specialization" label="Specialization">
            <Input placeholder="e.g. Cardiology" />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input placeholder="e.g. Cardiology Dept" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? 'Update' : 'Create'}</Button>
            <Button onClick={() => navigate('/doctors')}>Cancel</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
