export const config = {
  port: process.env.PORT || 3000,
  influxDb: {
    url: process.env.INFLUXDB_URL || 'http://localhost:8086',
    token: process.env.INFLUXDB_TOKEN || 'your-token',
    org: process.env.INFLUXDB_ORG || 'your-org',
    bucket: process.env.INFLUXDB_BUCKET || 'weather_monitoring'
  }
};