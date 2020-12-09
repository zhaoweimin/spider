"use strict";

// 引入模块
var https = require("https"); 
var http = require("http");
var fs = require("fs");
var path = require("path");

var cheerio = require("cheerio"); // 引入cheerio插件

// 爬去路径options设置
let options = {
  hostname: 'huaban.com',
  path: '/boards/65795129/'
}

// 分析他的接口路径得出，他是根据max id判断分页的，
let pin_id = 0
// 设置爬取最大页数
let max = 10; 
let num = 1;
// 获取当前时间戳，作为文件夹名称
let dirName = `img_${new Date().getTime()}`;


// 执行主函数
main();

// 爬虫的URL信息
function main(page = 0) {
  // 创建http get请求
  if(page !== 0) {
    options.path = `/boards/65795129/?kia0j949&max=${pin_id}&limit=20&wfl=1`
  }
  https
    .get(options, function (res) {
      var html = ""; // 保存抓取到的HTML源码
      // 前面说过
      // 这里的 res 是 Class: http.IncomingMessage 的一个实例
      // 而 http.IncomingMessage 实现了 stream.Readable 接口
      // 所以 http.IncomingMessage 也有 stream.Readable 的事件和方法
      // 比如 Event: 'data', Event: 'end', readable.setEncoding() 等

      // 设置编码
      res.setEncoding("utf-8");
      

      // 抓取页面内容
      res.on("data", function (chunk) {
        // console.log(chunk)
        html += chunk;
      });

      res.on("end", function () {
        // 使用 cheerio 加载抓取到的HTML代码
        // 然后就可以使用 jQuery 的方法了
        // 比如获取某个class：$('.className')
        // 这样就能获取所有这个class包含的内容
        var $ = cheerio.load(html);
        // 解析页面

        //判断文件夹是否存在
        exists(dirName, res => {
          if(res) {
            mkdir(dirName); // 不存在则创建文件夹
          }
        })
       
        $("script").each(function (i, el) {
          // 获取图片链接
          if (typeof $(this)[0].children[0] === "object") {
            if (
              $(this)[0].children[0].data.indexOf('app.page["board"]') !== -1
            ) {
              let map = $(this)[0]
                .children[0].data.split('app.page["board"] = ')[1]
                .split('"key":"');
              let keys = [];
              map.forEach((vo, idx) => {
                if (idx > 0) {
                  let arr = vo.split('", "');
                  let item = {
                    pin_id: '',
                    key: arr[0],
                    type: arr[1].split('type":"image/')[1],
                    url: `https://hbimg.huabanimg.com/${arr[0]}_fw658`,
                  };
                  if(idx === map.length - 2) {
                    console.log(vo.split('"pin_id":')[1].split(', "user_id"')[0])
                    pin_id = vo.split('"pin_id":')[1].split(', "user_id"')[0]
                  }
                  keys.push(item);
                  downloadImg(`${dirName}/`, item); //下载图片

                  // https://hbimg.huabanimg.com/8f6354d36016ef7fe771a9155496e373b47ccfe41d6a98-jWoSXz_fw236
                  // http://img.hb.aicdn.com/5e7a7014cb525475baf836740309b9c6725e1f6d44445-NeX8sB_fw658
                  // https://huaban.com/boards/65795129/?kia0j94${num}&max=3615683896&limit=20&wfl=1
                  // console.log(arr[1].split('type":"')[1])
                }
              });
            }
          }
        });

        // 判断页面页数，回调
        if (num < max) {
          main(num)
          num++
        }
      });
    })
    .on("error", function (err) {
      console.log(err);
    });
}

// 判断文件夹存在不
function exists(name, callback) {
  fs.exists(`./${name}`, function (exists) {
    if (exists) {
      console.log("文件存在");
      callback(false)
    }
    if (!exists) {
      console.log("文件不存在");
      callback(true)
    }
  });
}

// 创建文件夹
function mkdir(name) {
  fs.mkdir(`./${name}`, function (err) {
    if (err) {
      return console.error(err);
    }
    console.log("目录创建成功。");
  });
}

// 下载图片
function downloadImg(imgDir, item) {
  let httpObj = item.url.indexOf('https') !== -1 ? https : http;
  httpObj.get(item.url, function (res) {
      var data = "";

      res.setEncoding("binary");

      res.on("data", function (chunk) {
        data += chunk;
      });

      res.on("end", function () {
        fs.writeFile(
          imgDir + path.basename(`${item.key}.${item.type}`),
          data,
          "binary",
          function (err) {
            if (err) {
              return console.log(err);
            }
            console.log(
              `Image downloaded: 在${imgDir}`,
              path.basename(`${item.key}.${item.type}`)
            );
          }
        );
      });
    })
    .on("error", function (err) {
      console.log(err);
    });
}
