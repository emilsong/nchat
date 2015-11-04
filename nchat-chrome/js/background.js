
var getRegExec = function(regStr,str,idx,prefix,endfix){
	var idx = idx||1;
	var prefix = prefix||"";
	var endfix = endfix||"";
	var reg = new RegExp(regStr);
	var match = reg.exec(str);
	if(match!=null)
		return prefix+match[idx]+endfix;
	else
		return "";
};


function getRequest(url,name){
	var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)"); 
	var r = url.match(reg);
	if (r!=null) return r[2]; return ""; 
}

function convertImgToBase64(url, callback, outputFormat){
    var canvas = document.createElement('CANVAS'),
        ctx = canvas.getContext('2d'),
        img = new Image;
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img,0,0);
        var dataURL = canvas.toDataURL(outputFormat || 'image/png');
        callback.call(this, dataURL);
        canvas = null; 
    };
    img.src = url;
}


var port = new backgroundConnector();
port.name = "nchat";
port.onConnect = function(p){
	console.log(p,"cnnt");
};
port.onDisConnect = function(p){
	console.log(p,"disc");
};

port.init(function(msg){
	//console.log(msg,'message');
	
	switch(msg.type){
		case "ajax":
			var data = {
				name:msg.name,//get/getJSON/post
				url:msg.url,
				id:msg.id
			};
			switch(data.name){
				case "get":
					$.get(data.url,function(result){
						port.send({type:"ajax",id:msg.id,data:result});
					});
				break;
				case "getJSON":
					$.getJSON(data.url,function(result){
						port.send({type:"ajax",id:msg.id,data:result});
					});
				break;
			}
		break;
		case "login":
		
			
			chrome.cookies.get({url:'http://www.renren.com',name:'id'},function(ck){
				if(ck!=null){
					var user = {};
					user.id = ck.value;
					$.get("http://friend.renren.com/managefriends",function(result){
						var html = "";
						var userStr = getRegExec('nx\\.user = \\{([\\s\\S]*)nx.user.isvip',result);
						user.name = getRegExec('name : "(.*?)".',userStr);
						user.pic = getRegExec('tinyPic	: "(.*?) ",',userStr);
						//user.pic = user.pic.replace("tiny","main");
						//convertImgToBase64(user.pic,function(base64Img){
							html="<p><img data-id='rr-"+user.id+"' data-name='"+user["name"]+"' class='photo' src='"+user.pic+"'/></p><p class='name'><i class='fa fa-renren'></i>"+user["name"]+"</p>";
							port.send({type:"login",html:html});
						//});
						
					});
				}
				
			});
			
			chrome.cookies.get({url: 'http://user.qzone.qq.com',name:'pt2gguin'},function(ck){
				if(ck!=null){
					var qqid =  parseInt(ck.value.replace("o",""));
					$.get("http://user.qzone.qq.com/"+qqid,function(result){
						var html = "";
						var reg = new RegExp('<span class="user-name textoverflow">(.*?)</span>','');
						var match = reg.exec(result);
						var reg1 = new RegExp('<div class="head-avatar">([\\s\\S]*)<img src="(.*?)" class="user-avatar"','');
						var match1 = reg1.exec(result);
						
						//convertImgToBase64(match1[2],function(base64Img){
							html="<p><img data-id='qq-"+qqid+"' data-name='"+match[1]+"' class='photo' src='"+match1[2]+"'/></p><p class='name'><i class='fa fa-qq'></i>"+match[1]+"</p>";
							port.send({type:"login",html:html});
						//});
						
					});
				}
			});
			
			
			chrome.cookies.get({url: 'http://www.weibo.com',name:'SUP'},function(ck){
				if(ck!=null){
					var html = "";
					var weiboStr = decodeURIComponent(ck.value);
					var uid = getRequest(weiboStr,"uid");
					
					$.get("http://level.account.weibo.com/level/mylevel",function(result){
						var reg = new RegExp('<img width="60" height="60" alt="Foosux" src="(.*?)" class="W_face_radius"','g');
						var match = reg.exec(result);
						var reg1 = new RegExp('{"name":"(.*?)",','g');
						var match1 = reg1.exec(result);
						
						//convertImgToBase64(match[1],function(base64Img){
							html="<p><img data-id='wb-"+uid+"' data-name='"+match1[1]+"' class='photo' src='"+match[1]+"'/></p><p class='name'><i class='fa fa-weibo'></i>"+match1[1]+"</p>";
							port.send({type:"login",html:html});
						//});
					});
				}
				
				
			});
			
		break;
	}
	
});




/*
setInterval(function(){
	port.send({type:"message",lyric:(new Date()).Format("yyyy-MM-dd hh:mm:ss.S")});
},3000);
*/


chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
		//console.log(details);
        if (details.type === 'image') {
			var domain = "http://www.qq.com";
			if(details.url.indexOf("hdn.xnimg.cn"))
				domain = "http://www.renren.com";
            var exists = false;
            for (var i = 0; i < details.requestHeaders.length; ++i) {
                if (details.requestHeaders[i].name === 'Referer') {
                    exists = true;
                    details.requestHeaders[i].value = 'http://www.qq.com';
                    break;
                }
            }
            if (!exists) {
				details.requestHeaders.push({ name: 'Referer', value: 'http://www.qq.com'});
            }
            return { requestHeaders: details.requestHeaders };
        }
    },
    {urls: ['http://*.qq.com/qzone/*','http://hdn.xnimg.cn/*']},
    ["blocking", "requestHeaders"]
);



chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        if (details.type === 'xmlhttprequest'||details.type === 'other') {
            var exists = false;
            for (var i = 0; i < details.requestHeaders.length; ++i) {
                if (details.requestHeaders[i].name === 'Referer') {
                    exists = true;
                    details.requestHeaders[i].value = 'http://music.163.com';
                    break;
                }
            }

            if (!exists) {
             details.requestHeaders.push({ name: 'Referer', value: 'http://music.163.com'});
            }

            return { requestHeaders: details.requestHeaders };
        }
    },
    {urls: ['http://music.163.com/api/*','http://*.music.126.net/*']},
    ["blocking", "requestHeaders"]
);