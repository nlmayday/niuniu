"use strict";

exports.clone = function( obj )
{
    if( obj === null ) return null;

    let o;
    if( typeof obj == "object" )
    {
        o = obj.constructor === Array ? [] : {};
        for( let i in obj )
        {
            if( obj.hasOwnProperty( i ) )
            {
                o[ i ] = typeof obj[ i ] === "object" ? exports.clone( obj[ i ] ) : obj[ i ];
            }
        }
    }
    else
    {
        o = obj;
    }
    return o;
};
exports.dateFormat  = function( format , date ) {
    if(date) {
        date = new Date(date);
    }
    else {
        date = new Date();
    }
    format=format.replace(/y+/,"" + date.getFullYear());
    format=format.replace(/M+/,date.getMonth()>=9?""+(date.getMonth()+1):"0"+(date.getMonth()+1));
    format=format.replace(/d+/,"" + date.getDate()>=10?""+date.getDate():"0"+date.getDate());
    format=format.replace(/h+/,"" + date.getHours()>=10?""+date.getHours():"0"+date.getHours());
    format=format.replace(/m+/,"" + date.getMinutes()>=10?""+date.getMinutes():"0"+date.getMinutes());
    format=format.replace(/s+/,"" + date.getSeconds()>=10?""+date.getSeconds():"0"+date.getSeconds());
    format=format.replace(/q+/,"" + Math.floor(date.getMonth()/3 + 1));
    format=format.replace(/S+/,"" + date.getMilliseconds()>=10?""+date.getMilliseconds():"0"+date.getMilliseconds());

    return format;
}