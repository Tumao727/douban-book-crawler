// 系统标准库放在前面
const fs = require('fs')

// 接着放第三方库
const request = require('syncrequest')
const cheerio = require('cheerio')

// 最后放自己写的模块
const log = console.log.bind(console)


// ES6 定义一个类
class Book {
    constructor() {
        this.name = ''
        this.score = 0
        this.quote = ''
        this.numberOfComments = 0
        this.author = ''
        this.press = ''
        this.year = 0
    }
}



const bookFromTable = (table) => {
    let e = cheerio.load(table)

    let book = new Book()
    
    book.name = e(".pl2").find('a').attr('title')
    book.score = Number(e('.rating_nums').text())
    book.quote = e('.inq').text()
    book.numberOfComments = Number(e('.star').find('.pl').text().slice(22, -21))

    let info = e('.pl').text().split(' / ')
    book.author = info[0]
    book.press = info[info.length - 3]
    book.year = Number(info[info.length - 2].slice(0, 4))
    
    return book
}

const ensurePath = (path) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
    }
}

const cachedUrl = (url) => {
    let cachePath = 'cached_html'
    
    let cacheFile = cachePath + '/' + url.split('?')[1] + '.html'
    
    ensurePath(cachePath)
    let exists = fs.existsSync(cacheFile)
    if (exists) {
        let data = fs.readFileSync(cacheFile)
        return data
    } else {
        
        let r = request.get.sync(url)
        let body = r.body
        
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

const booksFromUrl = (url) => {
    let body = cachedUrl(url)
    let e = cheerio.load(body)

    let bookTables = e('.item')
    
    let books = []
    for (let i = 0; i < bookTables.length; i++) {
        let table = bookTables[i]
        let b = bookFromTable(table)
        books.push(b)
    }
    return books
}

const savebook = (books) => {
    let s = JSON.stringify(books, null, 2)
    let path = 'douban.txt'
    fs.writeFileSync(path, s)
}

const __main = () => {
    // 主函数
    let books = []
    for (let i = 0; i < 10; i++) {
        let start = i * 25
        let url = `https://book.douban.com/top250?start=${start}`
        let booksInPage = booksFromUrl(url)
        // concat 拼接数组
        books = books.concat(booksInPage)
    }
    savebook(books)
    log('抓取成功, 数据已经写入到 douban.txt 中')
}

__main()
