module.exports=[921517,(a,b,c)=>{b.exports=a.x("http",()=>require("http"))},524836,(a,b,c)=>{b.exports=a.x("https",()=>require("https"))},427699,(a,b,c)=>{b.exports=a.x("events",()=>require("events"))},449719,(a,b,c)=>{b.exports=a.x("assert",()=>require("assert"))},870722,(a,b,c)=>{b.exports=a.x("tty",()=>require("tty"))},500874,(a,b,c)=>{b.exports=a.x("buffer",()=>require("buffer"))},677652,(a,b,c)=>{b.exports=a.x("node:diagnostics_channel",()=>require("node:diagnostics_channel"))},679594,(a,b,c)=>{b.exports=a.x("dns",()=>require("dns"))},99348,(a,b,c)=>{b.exports=a.x("string_decoder",()=>require("string_decoder"))},137936,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"registerServerReference",{enumerable:!0,get:function(){return d.registerServerReference}});let d=a.r(211857)},713095,(a,b,c)=>{"use strict";function d(a){for(let b=0;b<a.length;b++){let c=a[b];if("function"!=typeof c)throw Object.defineProperty(Error(`A "use server" file can only export async functions, found ${typeof c}.
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
      `})}catch(a){throw console.error("Failed to send password reset email:",a),Error("Failed to send password reset email")}}a.s(["sendInvitationEmail",0,e,"sendPasswordResetEmail",0,f])},36354,(a,b,c)=>{"use strict";b.exports=(a,b=process.argv)=>{let c=a.startsWith("-")?"":1===a.length?"-":"--",d=b.indexOf(c+a),e=b.indexOf("--");return -1!==d&&(-1===e||d<e)}},445681,(a,b,c)=>{"use strict";let d,e=a.r(446786),f=a.r(870722),g=a.r(36354),{env:h}=process;function i(a){return 0!==a&&{level:a,hasBasic:!0,has256:a>=2,has16m:a>=3}}function j(a,b){if(0===d)return 0;if(g("color=16m")||g("color=full")||g("color=truecolor"))return 3;if(g("color=256"))return 2;if(a&&!b&&void 0===d)return 0;let c=d||0;if("dumb"===h.TERM)return c;{let a=e.release().split(".");return Number(a[0])>=10&&Number(a[2])>=10586?Number(a[2])>=14931?3:2:1}}g("no-color")||g("no-colors")||g("color=false")||g("color=never")?d=0:(g("color")||g("colors")||g("color=true")||g("color=always"))&&(d=1),"FORCE_COLOR"in h&&(d="true"===h.FORCE_COLOR?1:"false"===h.FORCE_COLOR?0:0===h.FORCE_COLOR.length?1:Math.min(parseInt(h.FORCE_COLOR,10),3)),b.exports={supportsColor:function(a){return i(j(a,a&&a.isTTY))},stdout:i(j(!0,f.isatty(1))),stderr:i(j(!0,f.isatty(2)))}},60756,a=>{"use strict";var b=a.i(605532),c=a.i(129673),d=a.i(93321),e=a.i(267713);async function f(a,f){let g=await b.db.query.teams.findFirst({where:(0,d.eq)(c.teams.id,a),with:{plan:!0}});if(!g||!g.plan)throw Error("Team has no active plan.");let h=g.plan,i=0,j=0,k="";switch(f){case"users":i=await (0,e.getTeamMemberCount)(a),j=h.maxUsers,k="Users";break;case"contacts":i=await (0,e.getContactCount)(a),j=h.maxContacts,k="Contacts";break;case"instances":i=await (0,e.getInstanceCount)(a),j=h.maxInstances,k="WhatsApp connections"}if(-1!==j&&i>=j)throw Error(`${k} limit reached (${i}/${j}). Please upgrade your plan.`)}async function g(a,e){let f=await b.db.query.teams.findFirst({where:(0,d.eq)(c.teams.id,a),with:{plan:!0}});return!!f&&!!f.plan&&!0===f.plan[e]}async function h(a,b){if(!await g(a,b))throw Error("Your current plan does not allow access to this feature.")}a.s(["enforceFeature",0,h,"enforceLimit",0,f])},833453,a=>{"use strict";var b=a.i(826629),c=a.i(516840);a.i(570396);var d=a.i(673727),e=a.i(605532),f=a.i(129673),g=a.i(93321),h=a.i(267713);let i=new b.default(process.env.STRIPE_SECRET_KEY,{apiVersion:c.STRIPE_API_VERSION});async function j({team:a,priceId:b}){let c=await (0,h.getUser)();a&&c||(0,d.redirect)(`/sign-up?redirect=checkout&priceId=${b}`);let k=await e.db.query.plans.findFirst({where:(0,g.eq)(f.plans.stripePriceId,b)}),l={metadata:{planId:k?.id.toString()||""}};k&&k.trialDays>0&&(l.trial_period_days=k.trialDays);let m=await i.checkout.sessions.create({payment_method_types:["card"],line_items:[{price:b,quantity:1}],mode:"subscription",success_url:`${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${process.env.BASE_URL}/pricing`,customer:a.stripeCustomerId||void 0,client_reference_id:c.id.toString(),allow_promotion_codes:!0,subscription_data:l});(0,d.redirect)(m.url)}async function k(a){let b;a.stripeCustomerId&&a.stripeProductId||(0,d.redirect)("/pricing");let c=await i.billingPortal.configurations.list();if(c.data.length>0)b=c.data[0];else{let c=await i.products.retrieve(a.stripeProductId);if(!c.active)throw Error("Team's product is not active in Stripe");let d=await i.prices.list({product:c.id,active:!0});if(0===d.data.length)throw Error("No active prices found for the team's product");b=await i.billingPortal.configurations.create({business_profile:{headline:"Manage your subscription"},features:{subscription_update:{enabled:!0,default_allowed_updates:["price","quantity","promotion_code"],proration_behavior:"create_prorations",products:[{product:c.id,prices:d.data.map(a=>a.id)}]},subscription_cancel:{enabled:!0,mode:"at_period_end",cancellation_reason:{enabled:!0,options:["too_expensive","missing_features","switched_service","unused","other"]}},payment_method_update:{enabled:!0}}})}return i.billingPortal.sessions.create({customer:a.stripeCustomerId,return_url:`${process.env.BASE_URL}/dashboard`,configuration:b.id})}a.s(["createCheckoutSession",0,j,"createCustomerPortalSession",0,k])},223242,a=>{"use strict";var b=a.i(371881);a.s([],769654),a.i(769654),a.s(["00d5275fe9c38e58dd392fc9d1b09f60662122d2c3",()=>b.signOut],223242)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0bot~zs._.js.map