window.onload = () => {
  var o =  ['m','.',':','t','@','g','ail'];
  var addr = o[0] + o[6] + o[3] + 'o' + o[2] + o[3] + 'arh' + o[1] + 'x2' + o[4] + o[5] + o[0] + o[6] + o[1] + 'com';
  var s = '<a class="BlockLink" href="' + addr + '">E-' + o[0] + o[6] + '</a>';
  var list = <any>document.getElementsByClassName('ph-email');
console.log(list);
  for (var i = 0, len = list.length; i < len; ++i)
    list[i].innerHTML = s;
};
