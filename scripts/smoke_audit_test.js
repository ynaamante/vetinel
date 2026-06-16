const http = require('http');
function req(options, body){
  return new Promise((resolve,reject)=>{
    const r = http.request(options, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode,body:d,headers:res.headers}));
    });
    r.on('error',reject);
    if(body) r.write(JSON.stringify(body));
    r.end();
  });
}
(async()=>{
  const API_PORT = 3000;
  try{
    console.log('Creating clinic (auth)');
    let res = await req({hostname:'localhost',port:API_PORT,path:'/api/clinics',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer secret-token','X-User-Id':'1'}}, {name:'Audit Test Clinic'});
    console.log(res.status,res.body);
    const clinic = JSON.parse(res.body);

    console.log('Creating role (auth)');
    res = await req({hostname:'localhost',port:API_PORT,path:'/api/roles',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer secret-token','X-User-Id':'1'}}, {name:'AuditRoleTest'});
    console.log(res.status,res.body);
    let role = null;
    if (res.status === 201) {
      role = JSON.parse(res.body);
    } else if (res.status === 409) {
      // role exists; fetch list and find it
      const list = await req({hostname:'localhost',port:API_PORT,path:'/api/roles',method:'GET',headers:{'Content-Type':'application/json'}});
      try{
        const rows = JSON.parse(list.body);
        role = rows.find(r=>r.name==='AuditRoleTest') || rows[0];
        console.log('Found existing role', role && role.id);
      }catch(e){ console.error('Could not parse role list', e); }
    }

    console.log('Creating user (no auth)');
    if (!role) throw new Error('role not available');
    res = await req({hostname:'localhost',port:API_PORT,path:'/api/users',method:'POST',headers:{'Content-Type':'application/json'}}, {name:'Audit User', email:'audit@example.test', password:'pass123', clinic_id:clinic.id, role_id:role.id});
    console.log(res.status,res.body);
    let user = null;
    if (res.status === 201) {
      user = JSON.parse(res.body);
    } else if (res.status === 409) {
      // user exists - find by email
      const list = await req({hostname:'localhost',port:API_PORT,path:'/api/users',method:'GET',headers:{'Content-Type':'application/json'}});
      try{
        const rows = JSON.parse(list.body);
        user = rows.find(u=>u.email==='audit@example.test');
        console.log('Found existing user', user && user.id);
      }catch(e){ console.error('Could not parse user list', e); }
    }

    if (user && user.id) {
      console.log('Updating user (auth)');
      res = await req({hostname:'localhost',port:API_PORT,path:'/api/users/'+user.id,method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer secret-token','X-User-Id':'1'}}, {name:'Audit User Updated'});
      console.log(res.status,res.body);
    } else {
      console.log('Skipping user update — no user available');
    }

    console.log('Updating clinic (auth)');
    res = await req({hostname:'localhost',port:API_PORT,path:'/api/clinics/'+clinic.id,method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer secret-token','X-User-Id':'1'}}, {owner:'Audit Owner'});
    console.log(res.status,res.body);

    console.log('Updating role (auth)');
    res = await req({hostname:'localhost',port:API_PORT,path:'/api/roles/'+role.id,method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer secret-token','X-User-Id':'1'}}, {description:'audit role desc'});
    console.log(res.status,res.body);

    if (user && user.id) {
      console.log('Deleting user (auth)');
      res = await req({hostname:'localhost',port:API_PORT,path:'/api/users/'+user.id,method:'DELETE',headers:{'Authorization':'Bearer secret-token','X-User-Id':'1'}});
      console.log(res.status,res.body);
    } else {
      console.log('Skipping user delete — no user available');
    }

    // fetch audit trail
    console.log('Fetch audit entries');
    res = await req({hostname:'localhost',port:API_PORT,path:'/api/audit-trail',method:'GET',headers:{}});
    console.log('AUDIT',res.status,res.body);
  }catch(e){ console.error('ERROR',e); process.exit(1);} finally{ setTimeout(()=>process.exit(),200);} })();
