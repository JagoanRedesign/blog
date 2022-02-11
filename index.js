var fs = require('fs');
var http = require('http');
var unirest = require('unirest');
var random_useragent = require('random-useragent');
const cheerio = require('cherio');
const minifier = require('string-minify');
const contentencodings = require('content-encodings');
const sanitizeHtml = require('sanitize-html');
const removeEmptyLines = require("remove-blank-lines")
const decodeUriComponent = require('decode-uri-component');

function convertToSlug(str) {
    str = str.replace(/[`\\\"\\|\/\s]/g, ' ').toLowerCase();
    return str;
};

function convertToValidName(str) {
    str = str.replace(/[`~!@#$%^&*()_\-+=\[\]{};:'"\\|\/,.<>?\s]/g, ' ').toLowerCase();
    str = str.replace(/^\s+|\s+$/gm, '');
    str = str.replace(/\s+/g, ' ');
    return str;
};

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

http.createServer(function (req, res) {
  function E404(){
    fs.readdir("page","utf-8", function (err, data) {
      let dataPage = data;
      var statusReqPage=false;
      for(var i=0;i<dataPage.length;i++){
        if(req.url=="/"+dataPage[i]){
          statusReqPage=true;
        };
      };
      if(statusReqPage==true){
        fs.readFile("page"+req.url,"utf-8", function (err, data) {
          res.writeHead(200, {
            "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
            "pragma": "no-cache",
            "server": "Anonymouse"
          });
          res.end(data);
        });
      } else {
        fs.readFile("404.html","utf-8", function (err, data2) {
          res.writeHead(404);
          res.end(data2);
        });
      };
    });
  };
  if (req.method === "GET") {
    let url=req.url;
    if(url=="/?build"){
      fs.readFile("build.html","utf-8", function (err, data) {
        res.writeHead(200, {
          "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
          "content-type": "text/html; charset=UTF-8",
          "pragma": "no-cache",
          "server": "Anonymouse"
        });
        res.end(data);
      });
    } else if(url=="/rules.json"){
      fs.readFile("rules.json", function (err, data) {
        res.writeHead(200, {
          "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
          "pragma": "no-cache",
          "server": "Anonymouse"
        });
        res.end(data);
      });
    } else if(url=="/"){
      fs.readFile("rules.json","utf-8", function (err, data) {
        let rules=JSON.parse(data);
        let nameWeb=rules.nameWebsite;
        let title=nameWeb+" - "+rules.titleHome;
        let titleHome="Random Post";
        let description=rules.descriptionWeb;
        let thisReqUrl="https://"+req.headers.host;
        let image=rules.imageHOME;
        let logo=rules.logoWeb;
        let author=rules.author;
        let date=new Date().toISOString();
        let dateModif=new Date().toISOString();
        let jRules=rules.domain.length;
        let postHome=Number(rules.PostHome);
        var link=[];
        var titleLink=[];
        var position=[];
        var category="";
        let content="<div id='dbContent'/>"
        for(var i=0;i<jRules;i++){
          var listLink=rules[i].listLink;
          category="/"+rules.category[i]+"/";
          var permaSplit=Number(rules.permaSplit[i]);
          for(var j=0;j<listLink.length;j++){
            link.push("https://"+req.headers.host+category+listLink[j].split("/")[permaSplit]);
            titleLink.push(convertToValidName(listLink[j].split("/")[permaSplit].replace(".html","")));
            position.push(j);
          };
        };
        position=shuffle(position);
        var  newLink=[];
        var newTitleLink=[];
        for(var i=0;i<postHome;i++){
          newLink.push(link[position[i]]);
          newTitleLink.push(titleLink[position[i]]);
        };
        let randomPost=`{"title":["`+newTitleLink.join('","')+`"],"link":["`+newLink.join('","')+`"]}`
        fs.readFile("template.html","utf-8", function (err, data) {
          res.writeHead(200, {
            "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
            "content-type": "text/html; charset=UTF-8",
            "pragma": "no-cache",
            "server": "Anonymouse"
          });
          var data=data;
          let tagPost=data.split("<$post>");
          let tagPage=data.split("<$page>");
          let tagHome=data.split("<$home>");
          let tagSearch=data.split("<$search>");
          let tag404=data.split("<$404>");
          for(var i=1;i<tagHome.length;i++){
            var areaHome =tagHome[i].split("</$home>")[0];
            var newAreaHome=areaHome.replace(/\$\{title\}/g,minifier(title));
            newAreaHome=newAreaHome.replace(/\$\{titleHome\}/g,minifier(titleHome));
            newAreaHome=newAreaHome.replace(/\$\{nameWeb\}/g,nameWeb);
            newAreaHome=newAreaHome.replace(/\$\{randomPost\}/g,randomPost);
            newAreaHome=newAreaHome.replace(/\$\{content\}/g,content);
            newAreaHome=newAreaHome.replace(/\$\{description\}/g,minifier(convertToSlug(description)));
            newAreaHome=newAreaHome.replace(/\$\{image\}/g,image);
            newAreaHome=newAreaHome.replace(/\$\{url\}/g,thisReqUrl);
            newAreaHome=newAreaHome.replace(/\$\{host\}/g,req.headers.host);
            newAreaHome=newAreaHome.replace(/\$\{author\}/g,author);
            newAreaHome=newAreaHome.replace(/\$\{logo\}/g,logo);
            newAreaHome=newAreaHome.replace(/\$\{date\}/g,date);
            newAreaHome=newAreaHome.replace(/\$\{dateModif\}/g,dateModif);
            // newAreaPost=newAreaPost.replace(/\$\{headline\}/g,minifier(convertToSlug(headline)));
            // newAreaPost=newAreaPost.replace(/\$\{articleBody\}/g,minifier(convertToSlug(articleBody)));
            data=data.replace(areaHome,newAreaHome);
          };
          for(var i=1;i<tagPost.length;i++){
            var areaPost =tagPost[i].split("</$post>")[0];
            data=data.replace(areaPost,"");
          };
          for(var i=1;i<tagPage.length;i++){
            var areaPage =tagPage[i].split("</$page>")[0];
            data=data.replace(areaPage,"");
          };
          for(var i=1;i<tagSearch.length;i++){
            var areaSearch =tagSearch[i].split("</$search>")[0];
            data=data.replace(areaSearch,"");
          };
          for(var i=1;i<tag404.length;i++){
            var area404 =tag404[i].split("</$404>")[0];
            data=data.replace(area404,"");
          };
          data=data.replace(/<\$post\>|<\/\$post>/g,"");
          data=data.replace(/<\$page\>|<\/\$page>/g,"");
          data=data.replace(/<\$home\>|<\/\$home>/g,"");
          data=data.replace(/<\$search\>|<\/\$search>/g,"");
          data=data.replace(/<\$404\>|<\/\$404>/g,"");
          res.end(removeEmptyLines(data));
        });
      });
    } else if(url.indexOf("robots.txt")>=0){
      res.writeHead(200, {
        "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
        "content-type": "text/plain; charset=UTF-8",
        "pragma": "no-cache",
        "server": "Anonymouse"
      });
      fs.readFile("robots.txt","utf-8", function (err, data) {
        let host=req.headers.host;
        data=data.replace(/\$\{host\}/g,host);
        res.end(data);
      });
    } else if(url.indexOf("ads.txt")>=0){
      res.writeHead(200, {
        "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
        "content-type": "text/plain; charset=UTF-8",
        "pragma": "no-cache",
        "server": "Anonymouse"
      });
      fs.readFile("ads.txt","utf-8", function (err, data) {
        res.end(data);
      });
    } else if(url.indexOf("sitemap.xml?page=")>=0){
      fs.readFile("rules.json","utf-8", function (err, data) {
        let rules=JSON.parse(data);
        let numberPage=Number(url.split("sitemap.xml?page=")[1]);
        let jRules=rules.domain.length;
        var link=[];
        var category="";
        var permaSplit="";
        for(var i=0;i<jRules;i++){
          var listLink=rules[i].listLink;
          category="/"+rules.category[i]+"/";
          permaSplit=Number(rules.permaSplit[i]);
          for(var j=0;j<listLink.length;j++){
            link.push(category+listLink[j].split("/")[permaSplit]);
          };
        };
        var newNumber=[];
        function builtMap(data){
          var j=0;
          var newData=Number(data);
          if(newData>=1000){
            for(var i=0;i<newData;i++){
              if(i<=1000){
                j=i;
              };
            };
            newNumber.push(j);
            newData=data-j
            builtMap(newData);
          } else {
            newNumber.push(data);
          };
        };
        builtMap(link.length);
        if(newNumber[numberPage]==undefined==false){
          var startLink=0;
          for(var i=0;i<=numberPage-1;i++){
            startLink=startLink+newNumber[i];
          };
          let host=req.headers.host;
          var buildS="";
          for(var i=0;i<newNumber[numberPage];i++){
            buildS=buildS+`<url><loc>https://`+host+link[Number(startLink+i)]+`</loc><changefreq>always</changefreq>
    <priority>1.0</priority></url>`;
          };
          buildS="<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd'>"+buildS+"</urlset>";
          res.writeHead(200, {
            "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
            "content-type": "text/xml;charset=UTF-8",
            "pragma": "no-cache",
            "server": "Anonymouse"
          });
          res.end(buildS);
        } else {
          E404();
        };
      });
    } else if(url.indexOf("sitemap.xml")>=0){
      fs.readFile("rules.json","utf-8", function (err, data) {
        let rules=JSON.parse(data);
        let jRules=rules.domain.length;
        var link=[]
        for(var i=0;i<jRules;i++){
          var listLink=rules[i].listLink;
          var permaSplit=Number(rules.permaSplit[i]);
          for(var j=0;j<listLink.length;j++){
            link.push(listLink[j].split("/")[permaSplit]);
          };
        };
        var newNumber=[];
        function builtMap(data){
          var j=0;
          var newData=Number(data);
          if(newData>=1000){
            for(var i=0;i<newData;i++){
              if(i<=1000){
                j=i;
              };
            };
            newNumber.push(j);
            newData=data-j
            builtMap(newData);
          } else {
            newNumber.push(data);
          };
        };
        builtMap(link.length);
        let host=req.headers.host;
        var buildS="";
        for(var i=0;i<newNumber.length;i++){
          buildS=buildS+`<sitemap><loc>https://`+host+`/sitemap.xml?page=`+i+`</loc></sitemap>`;
        };
        buildS="<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd'>"+buildS+"</sitemapindex>";
        res.writeHead(200, {
          "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
          "content-type": "text/xml;charset=UTF-8",
          "pragma": "no-cache",
          "server": "Anonymouse"
        });
        res.end(buildS);
      });
    } else if(url.indexOf(".html")>=0){
      fs.readFile("rules.json","utf-8", function (err, data) {  
        let rules=JSON.parse(data);
        let nameWeb=rules.nameWebsite;
        let author=rules.author;
        let logo=rules.logoWeb;
        let domain=rules.domain;
        let category=rules.category;
        let type=rules.type;
        var status=false;
        var position="";
        var newDomain="";
        var newCategory="";
        var newType="";
        url=decodeUriComponent(url);
        for(var i=0;i<category.length;i++){
          var indexUrl="/"+category[i]+"/";
          if( url.indexOf(indexUrl)==0 ){
            status=true;
            position=i;
            newCategory=indexUrl;
            newDomain=domain[i];
            newType=type[i];
          };
        };
        if(status==true){
          status=false;
          let mapUrl=url.split(newCategory)[1];
          let listLink=rules[position].listLink;
          var permalink="";
          for(var i=0;i<listLink.length;i++){
            if(listLink[i].indexOf(mapUrl)>=0){
              permalink=listLink[i];
              status=true;
            };
          };
          if(status==true){
            let setting=rules[position].setting;
            let urlTarget=newType+"://"+newDomain+permalink;
            let settingTitle=setting.title;
            let settingDescription=setting.description;
            let settingContent=setting.content;
            let settingImage=setting.image;
            let settingDate=setting.datePublish;
            let settingCategory=setting.category;
            urlTarget=urlTarget.split(".html")[0]+".html";
            unirest('GET', decodeUriComponent(urlTarget))
            .headers({
                'user-agent': random_useragent.getRandom(),
                "referer": "https://www.google.com/"
            })
            .end(function (resku) {
              var $=cheerio.load("<div></div>");
              try{
               $ = cheerio.load(resku.raw_body);
              } catch(e){
                console.log(e)
              }
              var title="null";
              var description="null";
              var content="null";
              var image="null";
              var date="null";
              var category="null";
              var hits="null";
              var articleBody="";
              //----- scrape title artikel --------------
              let settingTitleSelector=settingTitle.selector;
              let settingTitleTypeSelector=settingTitle.typeSelector;
              let settingTitleNumberSelectorAll=settingTitle.numberSelectorAll;
              let settingTitleTargetSelector=settingTitle.targetSelector;
              let settingTitleNameAttr=settingTitle.nameAttr;
              if(settingTitleTypeSelector=="one"){
                let dbTitle=$(settingTitleSelector)[0];
                if(settingTitleTargetSelector=="outerHTML"){
                  title=cheerio.html(dbTitle);
                } else if(settingTitleTargetSelector=="innerHTML"){
                  title=$(settingTitleSelector).html();
                } else if(settingTitleTargetSelector=="innerText"){
                  let newdbTitle=cheerio.html(dbTitle);
                  title=cheerio.load(newdbTitle).text();
                } else if(settingTitleTargetSelector=="valueAttr"){
                  title=$(settingTitleSelector).attr(settingTitleNameAttr);
                  if(title==undefined){
                    title="null";
                  }
                };
              } else if (settingTitleTypeSelector=="all") {
                if( $(settingTitleSelector)[settingTitleNumberSelectorAll]==undefined==false ){
                  let dbTitle=cheerio.load( $(settingTitleSelector)[settingTitleNumberSelectorAll] );
                  articleBody=$(settingTitleSelector).html();
                  if(settingTitleTargetSelector=="outerHTML"){
                    title=dbTitle.html();
                  } else if(settingTitleTargetSelector=="innerHTML"){
                    title=dbTitle(settingTitleSelector).html();
                  } else if(settingTitleTargetSelector=="innerText"){
                    title=dbTitle(settingTitleSelector).text();
                  } else if(settingTitleTargetSelector=="valueAttr"){
                    title=dbTitle(settingTitleSelector).attr(settingTitleNameAttr);
                    if(title==undefined){
                      title="null";
                    };
                  };
                };
              };
              //----- scrape description artikel --------------
              let settingDescriptionSelector=settingDescription.selector;
              let settingDescriptionTypeSelector=settingDescription.typeSelector;
              let settingDescriptionNumberSelectorAll=settingDescription.numberSelectorAll;
              let settingDescriptionTargetSelector=settingDescription.targetSelector;
              let settingDescriptionNameAttr=settingDescription.nameAttr;
              if(settingDescriptionTypeSelector=="one"){
                let dbDescription=$(settingDescriptionSelector)[0];
                if(settingDescriptionTargetSelector=="outerHTML"){
                  description=cheerio.html(dbDescription);
                } else if(settingDescriptionTargetSelector=="innerHTML"){
                  description=$(settingDescriptionSelector).html();
                } else if(settingDescriptionTargetSelector=="innerText"){
                  let newdbDescription=cheerio.html(dbDescription);
                  description=cheerio.load(newdbDescription).text();
                } else if(settingDescriptionTargetSelector=="valueAttr"){
                  description=$(settingDescriptionSelector).attr(settingDescriptionNameAttr);
                  if(description==undefined){
                    description="null";
                  }
                };
              } else if (settingDescriptionTypeSelector=="all") {
                if( $(settingDescriptionSelector)[settingDescriptionNumberSelectorAll]==undefined==false ){
                  let dbDescription=cheerio.load( $(settingDescriptionSelector)[settingDescriptionNumberSelectorAll] );
                  if(settingDescriptionTargetSelector=="outerHTML"){
                    description=dbDescription.html();
                  } else if(settingDescriptionTargetSelector=="innerHTML"){
                    description=dbDescription(settingDescriptionSelector).html();
                  } else if(settingDescriptionTargetSelector=="innerText"){
                    description=dbDescription(settingDescriptionSelector).text();
                  } else if(settingDescriptionTargetSelector=="valueAttr"){
                    //console.log(  )
                    description=dbDescription(settingDescriptionSelector).attr(settingDescriptionNameAttr);
                    if(description==undefined){
                      description="null";
                    };
                  };
                };
              };
              //----- scrape content artikel --------------
              let settingContentSelector=settingContent.selector;
              let settingContentTypeSelector=settingContent.typeSelector;
              let settingContentNumberSelectorAll=settingContent.numberSelectorAll;
              let settingContentTargetSelector=settingContent.targetSelector;
              let settingContentNameAttr=settingContent.nameAttr;
              if(settingContentTypeSelector=="one"){
                let dbContent=$(settingContentSelector)[0];
                articleBody=cheerio.load(dbContent).text();
                if(settingContentTargetSelector=="outerHTML"){
                  content=cheerio.html(dbContent);
                } else if(settingContentTargetSelector=="innerHTML"){
                  content=$(settingContentSelector).html();
                } else if(settingContentTargetSelector=="innerText"){
                  let newdbContent=cheerio.html(dbContent);
                  content=cheerio.load(newdbContent).text();
                } else if(settingContentTargetSelector=="valueAttr"){
                  content=$(settingContentSelector).attr(settingContentNameAttr);
                  if(content==undefined){
                    content="null";
                  }
                };
              } else if (settingContentTypeSelector=="all") {
                if( $(settingContentSelector)[settingContentNumberSelectorAll]==undefined==false ){
                  let dbContent=cheerio.load( $(settingContentSelector)[settingContentNumberSelectorAll] );
                  articleBody=dbContent(settingContentSelector).text();
                  if(settingContentTargetSelector=="outerHTML"){
                    content=dbContent.html();
                  } else if(settingContentTargetSelector=="innerHTML"){
                    content=dbContent(settingContentSelector).html();
                  } else if(settingContentTargetSelector=="innerText"){
                    content=dbContent(settingContentSelector).text();
                  } else if(settingContentTargetSelector=="valueAttr"){
                    content=dbContent(settingContentSelector).attr(settingContentNameAttr);
                    if(content==undefined){
                      content="null";
                    };
                  };
                };
              };
              //----- scrape image artikel --------------
              let settingImageSelector=settingImage.selector;
              let settingImageTypeSelector=settingImage.typeSelector;
              let settingImageNumberSelectorAll=settingImage.numberSelectorAll;
              let settingImageTargetSelector=settingImage.targetSelector;
              let settingImageNameAttr=settingImage.nameAttr;
              if(settingImageTypeSelector=="one"){
                let dbImage=$(settingImageSelector)[0];
                if(settingImageTargetSelector=="outerHTML"){
                  image=cheerio.html(dbImage);
                } else if(settingImageTargetSelector=="innerHTML"){
                  image=$(settingImageSelector).html();
                } else if(settingImageTargetSelector=="innerText"){
                  let newdbImage=cheerio.html(dbImage);
                  image=cheerio.load(newdbImage).text();
                } else if(settingImageTargetSelector=="valueAttr"){
                  image=$(settingImageSelector).attr(settingImageNameAttr);
                  if(image==undefined){
                    image="null";
                  }
                };
              } else if (settingImageTypeSelector=="all") {
                if( $(settingImageSelector)[settingImageNumberSelectorAll]==undefined==false ){
                  let dbImage=cheerio.load( $(settingImageSelector)[settingImageNumberSelectorAll] );
                  if(settingImageTargetSelector=="outerHTML"){
                    image=dbImage.html();
                  } else if(settingImageTargetSelector=="innerHTML"){
                    image=dbImage(settingImageSelector).html();
                  } else if(settingImageTargetSelector=="innerText"){
                    image=dbImage(settingImageSelector).text();
                  } else if(settingImageTargetSelector=="valueAttr"){
                    image=dbImage(settingImageSelector).attr(settingImageNameAttr);
                    if(image==undefined){
                      image="null";
                    };
                  };
                };
              };
              //----- scrape date artikel --------------
              let settingDateSelector=settingDate.selector;
              let settingDateTypeSelector=settingDate.typeSelector;
              let settingDateNumberSelectorAll=settingDate.numberSelectorAll;
              let settingDateTargetSelector=settingDate.targetSelector;
              let settingDateNameAttr=settingDate.nameAttr;
              if(settingDateTypeSelector=="one"){
                let dbDate=$(settingDateSelector)[0];
                if(settingDateTargetSelector=="outerHTML"){
                  date=cheerio.html(dbDate);
                } else if(settingDateTargetSelector=="innerHTML"){
                  date=$(settingDateSelector).html();
                } else if(settingDateTargetSelector=="innerText"){
                  let newdbDate=cheerio.html(dbDate);
                  date=cheerio.load(newdbDate).text();
                } else if(settingDateTargetSelector=="valueAttr"){
                  date=$(settingDateSelector).attr(settingDateNameAttr);
                  if(date==undefined){
                    date="null";
                  }
                };
              } else if (settingDateTypeSelector=="all") {
                if( $(settingDateSelector)[settingDateNumberSelectorAll]==undefined==false ){
                  let dbDate=cheerio.load( $(settingDateSelector)[settingDateNumberSelectorAll] );
                  if(settingDateTargetSelector=="outerHTML"){
                    date=dbDate.html();
                  } else if(settingDateTargetSelector=="innerHTML"){
                    date=dbDate(settingDateSelector).html();
                  } else if(settingDateTargetSelector=="innerText"){
                    date=dbDate(settingDateSelector).text();
                  } else if(settingDateTargetSelector=="valueAttr"){
                    //console.log(  )
                    date=dbDate(settingDateSelector).attr(settingDateNameAttr);
                    if(date==undefined){
                      date="null";
                    };
                  };
                };
              };
              //--- filter content ------------
              var filterOption={allowedTags: ["h1", "h2", "h3", "h4","h5", "h6","div","span","img","p","pre","br","b","code","iframe"]};
              content=sanitizeHtml(content,filterOption);
              fs.readFile("template.html","utf-8", function (err, data) {
                let thisReqUrl=newType+"://"+req.headers.host+newCategory+mapUrl;
                let dateModif=new Date().toISOString();
                var headline=description;
                var dataDescription=description.split("");
                if(dataDescription.length>109){
                  headline="";
                  for(var i=0;i<dataDescription.length;i++){
                    if(i<=109){
                      headline=headline+dataDescription[i];
                    };
                  };
                };
                let tagPost=data.split("<$post>");
                let tagPage=data.split("<$page>");
                let tagHome=data.split("<$home>");
                let tagSearch=data.split("<$search>");
                let tag404=data.split("<$404>");
                var data=data;
                for(var i=1;i<tagPost.length;i++){
                  var areaPost =tagPost[i].split("</$post>")[0];
                  var newAreaPost=areaPost.replace(/\$\{title\}/g,minifier(title));
                  newAreaPost=newAreaPost.replace(/\$\{content\}/g,content);
                  newAreaPost=newAreaPost.replace(/\$\{description\}/g,minifier(convertToSlug(description)));
                  newAreaPost=newAreaPost.replace(/\$\{image\}/g,image);
                  newAreaPost=newAreaPost.replace(/\$\{url\}/g,thisReqUrl);
                  newAreaPost=newAreaPost.replace(/\$\{host\}/g,req.headers.host);
                  newAreaPost=newAreaPost.replace(/\$\{nameWeb\}/g,nameWeb);
                  newAreaPost=newAreaPost.replace(/\$\{author\}/g,author);
                  newAreaPost=newAreaPost.replace(/\$\{logo\}/g,logo);
                  newAreaPost=newAreaPost.replace(/\$\{date\}/g,date);
                  newAreaPost=newAreaPost.replace(/\$\{dateModif\}/g,dateModif);
                  newAreaPost=newAreaPost.replace(/\$\{headline\}/g,minifier(convertToSlug(headline)));
                  newAreaPost=newAreaPost.replace(/\$\{articleBody\}/g,minifier(convertToSlug(articleBody)));
                  data=data.replace(areaPost,newAreaPost);
                };
                for(var i=1;i<tagPage.length;i++){
                  var areaPage =tagPage[i].split("</$page>")[0];
                  data=data.replace(areaPage,"");
                };
                for(var i=1;i<tagHome.length;i++){
                  var areaPage =tagHome[i].split("</$home>")[0];
                  data=data.replace(areaPage,"");
                };
                for(var i=1;i<tagSearch.length;i++){
                  var areaSearch =tagSearch[i].split("</$search>")[0];
                  data=data.replace(areaSearch,"");
                };
                for(var i=1;i<tag404.length;i++){
                  var area404 =tag404[i].split("</$404>")[0];
                  data=data.replace(area404,"");
                };
                data=data.replace(/<\$post\>|<\/\$post>/g,"");
                data=data.replace(/<\$page\>|<\/\$page>/g,"");
                data=data.replace(/<\$home\>|<\/\$home>/g,"");
                data=data.replace(/<\$search\>|<\/\$search>/g,"");
                data=data.replace(/<\$404\>|<\/\$404>/g,"");
                res.writeHead(200, {
                  "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
                  "content-type": "text/html; charset=UTF-8",
                  "pragma": "no-cache",
                  "server": "Anonymouse"
                });
                $=cheerio.load(data);
                $('*').filter(function(index, el) {
                  if( $(this).text().trim().length==0){
                    if(el.tagName=="div"||el.tagName=="span"||el.tagName=="p"){
                      $(this).remove();
                    };
                  };
                });
                res.end(removeEmptyLines($.html()));
              });
            });
          } else {
            E404();
          };
        } else {
          E404();
        };
      });
    } else {
      E404();
    };
  } else if(req.method === "POST"){
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*"
    });
    res.end("ok");
  } else {
    E404();
  };
}).listen(process.env.PORT);