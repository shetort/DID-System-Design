// app.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const identityRoutes = require('./routes/identityRoutes');
const vcManagerRoutes = require('./routes/vcManagerRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析 application/json 请求体
app.use(morgan('dev')); // 请求日志

// 路由挂载
app.use('/identity', identityRoutes);
app.use('/vcManage', vcManagerRoutes);
app.use('/log', logRoutes);

// 健康检查
app.get('/', (req, res) => {
    res.send('Decentralized Identity Middleware is running.');
});

// 404 路由兜底
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// 启动服务
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
