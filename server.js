const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// JSON 文件路径
const DATA_PATH = path.join(__dirname, 'data.json');

// 初始化文件（如果不存在）
if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, '[]');
}

// ----------------------------
// 核心工具函数
// ----------------------------
const readData = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_PATH));
    } catch (error) {
        throw new Error('数据读取失败');
    }
};

const saveData = (data) => {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
};

// ----------------------------
// RESTful API
// ----------------------------

// 1. 获取所有数据 [GET] /api/books
app.get('/api/books', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const start = (page - 1) * limit;
        const keyword = req.query.keywords || '';
        const books = {
            data: keyword === '' ? readData().slice(start, start + limit) : readData().filter(b =>
                b.title.includes(keyword.trim())
            ).slice(start, start + limit),
            total: readData().length,
        }
        if(books.data.length === 0) {
            res.status(200).json({books,code:500,message:'书籍不存在'})
        } else {
            res.json({books,code:200,message:keyword === '' ? '' : '搜索成功'});
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. 新增数据 [POST] /api/books
app.post('/api/books/add', (req, res) => {
    try {
        const books = readData();
        const newBook = {
            id: uuidv4(), // 自动生成唯一ID
            ...req.body
        };
        books.push(newBook);
        saveData(books);
        res.status(200).json({code:200,message:'添加成功'});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. 通过ID修改数据 [POST] /api/books/:id
app.post('/api/books/update', (req, res) => {
    try {
        const books = readData();
        const index = books.findIndex(b => b.id === req.body.id);

        if (index === -1) {
            return res.status(404).json({ error: '书籍不存在' });
        }

        books[index] = { ...books[index], ...req.body };
        saveData(books);
        res.status(200).json({code:200,message:'修改成功'});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. 通过ID删除数据 [DELETE] /api/books/:id
app.post('/api/books/delete', (req, res) => {
    try {
        let books = readData();
        const initialLength = books.length;
        books = books.filter(b => b.id !== req.body.id);

        if (books.length === initialLength) {
            return res.status(200).json({code:200,message:'书籍不存在'});
        }

        saveData(books);
        res.status(200).json({code:200,message:'删除成功'});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务运行中：http://localhost:${PORT}`);
});