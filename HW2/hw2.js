"use strict";

let out ="";
const months = '312831303130313130313031';
let week=0; //2023/1/1
for(let i=1; i<=12; i++){ //months
    out += '<table>';
    out += '<tr><td colspan="7">西元 2023 年' + i +'月</td></tr>';
    for(let c of "日一二三四五六")
        out += "<th>" + c + "</th>"; //印出星期幾
    let days = parseInt(months.substr(2*(i-1),2));  //提取字串中部分的字，並回傳整數
    let counter = Math.ceil((days+week)/7)*7; 
    for(let j =1; j<=counter; j++){  //days
        if(j%7 == 1) out += '<tr>';
        if(j <= week || j> days+week){
            out += '<td> &nbsp </td>';
        }else{
            out += '<td>' + (j-week) + '</td>';
        }
        if(j%7 == 0) out += '</tr>';
    }
    out += '</table>';
    week = (days+week) % 7;
    console.log(days+week,week);
}

document.write(out)