
document.addEventListener('DOMContentLoaded',()=>{
 const toggle=document.querySelector('.menu-toggle'), nav=document.querySelector('.nav');
 if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}
 document.querySelectorAll('.mail-form').forEach(form=>{
  form.addEventListener('submit',e=>{
   e.preventDefault();
   if(!form.reportValidity()) return;
   const data=new FormData(form), lines=[];
   for(const [key,value] of data.entries()){if(key!=='consent' && !(value instanceof File)) lines.push(`${key}: ${value}`);}
   const subject=encodeURIComponent('Заявка с сайта RVKINO DISTRIBUTION');
   const body=encodeURIComponent(lines.join('\n\n')+'\n\nСогласие на обработку персональных данных отмечено пользователем.');
   const status=form.querySelector('.form-status');
   const hasFiles=[...form.querySelectorAll('input[type=file]')].some(input=>input.files.length>0); status.textContent='Открываем почтовую программу. Проверьте адрес получателя и содержание письма, затем нажмите «Отправить». До подтверждения отправки заявка не поступила компании.'+(hasFiles?' Выбранные файлы необходимо вручную прикрепить к письму.':'');
   window.location.href=`mailto:RvKinoproduction@zohomail.com?subject=${subject}&body=${body}`;
  });
 });
});
