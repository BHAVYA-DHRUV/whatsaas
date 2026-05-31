module.exports=[137936,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"registerServerReference",{enumerable:!0,get:function(){return d.registerServerReference}});let d=a.r(211857)},713095,(a,b,c)=>{"use strict";function d(a){for(let b=0;b<a.length;b++){let c=a[b];if("function"!=typeof c)throw Object.defineProperty(Error(`A "use server" file can only export async functions, found ${typeof c}.
Read more: https://nextjs.org/docs/messages/invalid-use-server-value`),"__NEXT_ERROR_CODE",{value:"E352",enumerable:!1,configurable:!0})}}Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"ensureServerEntryExports",{enumerable:!0,get:function(){return d}})},553126,a=>{"use strict";var b=a.i(745069),c=a.i(149477);let d=process.env.RESEND_API_KEY?new b.Resend(process.env.RESEND_API_KEY):null;async function e(a,b,e){if(!d)return void console.log("Resend disabled");let f=`${process.env.BASE_URL}/sign-up?inviteId=${e}`,g=await (0,c.getBranding)(),h=g?.name||"WhatSaaS";try{await d.emails.send({from:`${h} <${process.env.RESEND_FROM_EMAIL||"onboarding@resend.dev"}>`,to:a,subject:`Invitation to join ${b} on ${h}`,html:`
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <h2>You've been invited!</h2>

          <p>
            You have been invited to join the team
            <strong>${b}</strong> on ${h}.
          </p>

          <p>
            Click the link below to accept the invitation and set up your account:
          </p>

          <p>
            <a
              href="${f}"
              style="
                display:inline-block;
                padding:10px 20px;
                background-color:#44A64D;
                color:white;
                text-decoration:none;
                border-radius:5px;
              "
            >
              Accept Invitation
            </a>
          </p>

          <p style="font-size:14px; color:#666;">
            Or copy this link:
            <br />
            <a href="${f}">
              ${f}
            </a>
          </p>
        </div>
      `})}catch(a){throw console.error("Failed to send invitation email:",a),Error("Failed to send invitation email")}}async function f(a,b){if(!d)return void console.log("Resend disabled");let e=`${process.env.BASE_URL}/reset-password?token=${b}`,f=await (0,c.getBranding)(),g=f?.name||"WhatSaaS";try{await d.emails.send({from:`${g} <${process.env.RESEND_FROM_EMAIL||"onboarding@resend.dev"}>`,to:a,subject:`Reset your password - ${g}`,html:`
        <div
          style="
            font-family:sans-serif;
            font-size:16px;
            line-height:1.6;
            max-width:600px;
            margin:0 auto;
          "
        >
          <h2>Password Reset</h2>

          <p>
            You requested a password reset for your ${g} account.
          </p>

          <p>
            Click the button below to set a new password.
            This link expires in 1 hour.
          </p>

          <p style="margin:24px 0;">
            <a
              href="${e}"
              style="
                display:inline-block;
                padding:12px 24px;
                background-color:#44A64D;
                color:white;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;
              "
            >
              Reset Password
            </a>
          </p>

          <p style="font-size:14px; color:#666;">
            Or copy this link:
            <br />
            <a href="${e}">
              ${e}
            </a>
          </p>

          <p
            style="
              font-size:13px;
              color:#999;
              margin-top:24px;
            "
          >
            If you didn't request this,
            you can safely ignore this email.
          </p>
        </div>
      `})}catch(a){throw console.error("Failed to send password reset email:",a),Error("Failed to send password reset email")}}a.s(["sendInvitationEmail",0,e,"sendPasswordResetEmail",0,f])},396161,a=>{"use strict";var b=a.i(137936),c=a.i(53112),d=a.i(93321),e=a.i(605532),f=a.i(129673),g=a.i(53058),h=a.i(553126),i=a.i(254799),j=a.i(713095);let k=c.z.object({email:c.z.string().email()});async function l(a,b){let c=k.safeParse(Object.fromEntries(b));if(!c.success)return{error:c.error.issues[0].message};let{email:g}=c.data;try{let[a]=await e.db.select({id:f.users.id}).from(f.users).where((0,d.eq)(f.users.email,g)).limit(1);if(a){let b=(0,i.randomUUID)(),c=new Date(Date.now()+36e5);await e.db.insert(f.passwordResetTokens).values({userId:a.id,token:b,expiresAt:c}),await (0,h.sendPasswordResetEmail)(g,b)}return{success:"If an account with that email exists, a reset link has been sent."}}catch(a){return console.error("Password reset request error:",a),{error:"Something went wrong. Please try again."}}}let m=c.z.object({token:c.z.string().min(1),password:c.z.string().min(8).max(100),confirmPassword:c.z.string().min(8).max(100)});async function n(a,b){let c=m.safeParse(Object.fromEntries(b));if(!c.success)return{error:c.error.issues[0].message};let{token:h,password:i,confirmPassword:j}=c.data;if(i!==j)return{error:"Passwords do not match."};try{let[a]=await e.db.select().from(f.passwordResetTokens).where((0,d.and)((0,d.eq)(f.passwordResetTokens.token,h),(0,d.isNull)(f.passwordResetTokens.usedAt),(0,d.gt)(f.passwordResetTokens.expiresAt,new Date))).limit(1);if(!a)return{error:"Invalid or expired reset link. Please request a new one."};let b=await (0,g.hashPassword)(i);return await Promise.all([e.db.update(f.users).set({passwordHash:b,updatedAt:new Date}).where((0,d.eq)(f.users.id,a.userId)),e.db.update(f.passwordResetTokens).set({usedAt:new Date}).where((0,d.eq)(f.passwordResetTokens.id,a.id))]),{success:"Password reset successfully. You can now sign in."}}catch(a){return console.error("Password reset error:",a),{error:"Something went wrong. Please try again."}}}(0,j.ensureServerEntryExports)([l,n]),(0,b.registerServerReference)(l,"6050dadad086cea8b5f6981ee7b80ee83884f58fff",null),(0,b.registerServerReference)(n,"60e4d905896248b0293d01ca0efcdb594a766a0f5e",null),a.s(["requestPasswordReset",0,l,"resetPassword",0,n])},149036,a=>{"use strict";var b=a.i(396161);a.s([],877256),a.i(877256),a.s(["6050dadad086cea8b5f6981ee7b80ee83884f58fff",()=>b.requestPasswordReset],149036)}];

//# sourceMappingURL=_0k9.us~._.js.map