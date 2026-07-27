const fs = require('fs');
let doc = fs.readFileSync('DOCUMENTATION.md', 'utf8');

doc = doc.replace(/\\Promise\.all\(\)\\/g, '\Promise.all()\');
doc = doc.replace(/\\User -> Follows -> User\\/g, '\User -> Follows -> User\');
doc = doc.replace(/\\Media -> DiaryEntry -> User\\/g, '\Media -> DiaryEntry -> User\');
doc = doc.replace(/\\etch\\/g, '\etch\');
doc = doc.replace(/\\Media\\/g, '\Media\');
doc = doc.replace(/\\Socket\.io\\/g, '\Socket.io\');
doc = doc.replace(/\\Supabase Realtime\\/g, '\Supabase Realtime\');

fs.writeFileSync('DOCUMENTATION.md', doc);
