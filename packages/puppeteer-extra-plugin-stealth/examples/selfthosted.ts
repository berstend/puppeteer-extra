import http from 'http'
import url from 'url'
import fs from 'fs'
import path from 'path'
import portfinder from 'portfinder';

import detectHeadless from './detect-headless'

const root = path.join(__dirname, 'files');
const fav = 'AAABAAEAEBACAAEAAQCwAAAAFgAAACgAAAAQAAAAIAAAAAEAAQAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA';

const main = () => new Promise<{ server: http.Server, url: string }>(async (resolve, reject) => {
    const port = await portfinder.getPortPromise()
    const server = http.createServer((req, res) => {
        try {
            let pathname = (url.parse(req.url || '').pathname) || '/';
            if (pathname.endsWith('/'))
                pathname += 'index.html';
            pathname = pathname.substring(1);
            let file = path.join(root, pathname);
            if (!path.resolve(file).startsWith(root)) {
                res.writeHead(404)
                res.end()
                return;
            }
            let exists = false
            try {
                const stats = fs.statSync(file);
                // fs.existsSync(file);
                exists = true;
                if (stats.isDirectory()){
                    res.writeHead(404)
                    res.end()
                    return
                }
            } catch (e) {
            }
            if (exists) {
                let mime = 'text/html'
                if (pathname.endsWith('js'))
                    mime = 'text/javascript'
                res.writeHead(200, { 'Content-Type': mime })
                fs.createReadStream(file).pipe(res)
            } else if (pathname === 'detectHeadless.js') {
                res.writeHead(200, { 'Content-Type': 'text/javascript' })
                let str = detectHeadless.toString()
                str = `(${str})();`
                res.write(str)
                res.end()
            } else if (pathname === 'favicon.ico') {
                res.writeHead(200, { 'Content-Type': 'image/x-icon' })
                res.write(Buffer.from(fav, 'base64'))
                res.end()
            } else {
                res.writeHead(404)
                res.end()
            }
        } catch (e) {
            console.error(e)
            res.writeHead(500);
        }
    })
    server.listen(port, () => {
        const url = `http://localhost:${port}/`;
        resolve({ server, url })
    })
    server.on('error', (err) => {
        reject(err)
    });
})

main().then(({ server, url }) => {
    console.log(`Server listening on ${url}`)
})
