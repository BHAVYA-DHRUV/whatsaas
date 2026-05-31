module.exports=[427699,(a,b,c)=>{b.exports=a.x("events",()=>require("events"))},921517,(a,b,c)=>{b.exports=a.x("http",()=>require("http"))},524836,(a,b,c)=>{b.exports=a.x("https",()=>require("https"))},137936,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0}),Object.defineProperty(c,"registerServerReference",{enumerable:!0,get:function(){return d.registerServerReference}});let d=a.r(211857)},713095,(a,b,c)=>{"use strict";function d(a){for(let b=0;b<a.length;b++){let c=a[b];if("function"!=typeof c)throw Object.defineProperty(Error(`A "use server" file can only export async functions, found ${typeof c}.
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
      `})}catch(a){throw console.error("Failed to send password reset email:",a),Error("Failed to send password reset email")}}a.s(["sendInvitationEmail",0,e,"sendPasswordResetEmail",0,f])},333201,a=>{"use strict";var b=a.i(826629),c=a.i(516840);a.s(["StripeAdapter",0,class{type="stripe";client;webhookSecret;constructor(a,d){this.client=new b.default(a,{apiVersion:c.STRIPE_API_VERSION}),this.webhookSecret=d}get stripeClient(){return this.client}async createCheckout(a){let b={metadata:{planId:a.planId.toString(),teamId:a.teamId.toString()}};a.trialDays&&a.trialDays>0&&(b.trial_period_days=a.trialDays);let c=[];return a.gatewayPriceId?c.push({price:a.gatewayPriceId,quantity:1}):c.push({price_data:{currency:a.currency,product_data:{name:a.planName},unit_amount:a.amount,recurring:{interval:a.interval}},quantity:1}),{url:(await this.client.checkout.sessions.create({payment_method_types:["card"],line_items:c,mode:"subscription",success_url:a.successUrl,cancel_url:a.cancelUrl,customer:a.existingCustomerId||void 0,client_reference_id:a.userId.toString(),allow_promotion_codes:!0,subscription_data:b})).url}}async cancelSubscription(a){await this.client.subscriptions.cancel(a)}async createPortalSession(a,b){return{url:(await this.client.billingPortal.sessions.create({customer:a,return_url:b})).url}}async verifyWebhook(a,b){if(!this.webhookSecret)throw Error("Webhook secret not configured");return this.client.webhooks.constructEvent(a,b,this.webhookSecret)}}])},650585,a=>{"use strict";var b=a.i(137936),c=a.i(605532),d=a.i(129673),e=a.i(93321),f=a.i(118558),g=a.i(267713);a.i(570396);var h=a.i(673727),i=a.i(53112),j=a.i(53058),k=a.i(553126),l=a.i(254799),m=a.i(333201),n=a.i(713095);let o=i.z.object({name:i.z.string().min(1),description:i.z.string().optional(),amount:i.z.coerce.number().min(0),currency:i.z.string().min(3).max(3).default("usd"),interval:i.z.enum(["month","year"]),trialDays:i.z.coerce.number().min(0).default(0),maxUsers:i.z.coerce.number().min(-1),maxContacts:i.z.coerce.number().min(-1),maxInstances:i.z.coerce.number().min(-1),isAiEnabled:i.z.boolean(),isFlowBuilderEnabled:i.z.boolean(),isCampaignsEnabled:i.z.boolean(),isTemplatesEnabled:i.z.boolean(),isVoiceCallsEnabled:i.z.boolean()});async function p(){let a=await (0,g.getUser)();if(!a||"admin"!==a.role)throw Error("Unauthorized");return a}async function q(a,b){try{if((await p()).id===a)return{error:"Cannot change your own role."};if(!["admin","member","owner"].includes(b))return{error:"Invalid role."};return await c.db.update(d.users).set({role:b,updatedAt:new Date}).where((0,e.eq)(d.users.id,a)),(0,f.revalidatePath)("/admin/users"),{success:"Role updated successfully"}}catch(a){return{error:a.message||"Failed to update role"}}}async function r(a){try{await p();let[b]=await c.db.select({id:d.users.id,email:d.users.email}).from(d.users).where((0,e.eq)(d.users.id,a)).limit(1);if(!b)return{error:"User not found."};let f=(0,l.randomUUID)(),g=new Date(Date.now()+36e5);return await c.db.insert(d.passwordResetTokens).values({userId:b.id,token:f,expiresAt:g}),await (0,k.sendPasswordResetEmail)(b.email,f),{success:"Reset link sent successfully."}}catch(a){return{error:a.message||"Failed to send reset link."}}}async function s(a,b){try{if(await p(),b.length<8)return{error:"Password must be at least 8 characters."};let f=await (0,j.hashPassword)(b);return await c.db.update(d.users).set({passwordHash:f,updatedAt:new Date}).where((0,e.eq)(d.users.id,a)),{success:"Password updated successfully."}}catch(a){return{error:a.message||"Failed to update password."}}}async function t(a){try{if((await p()).id===a)return{error:"Cannot delete your own account."};return await c.db.delete(d.teamMembers).where((0,e.eq)(d.teamMembers.userId,a)),await c.db.delete(d.activityLogs).where((0,e.eq)(d.activityLogs.userId,a)),await c.db.delete(d.users).where((0,e.eq)(d.users.id,a)),(0,f.revalidatePath)("/admin/users"),{success:"User deleted successfully"}}catch(a){return{error:a.message||"Failed to delete user"}}}async function u(a){try{if(await p(),1===a)return{error:"Cannot delete the system admin team."};return await c.db.delete(d.teamMembers).where((0,e.eq)(d.teamMembers.teamId,a)),await c.db.delete(d.activityLogs).where((0,e.eq)(d.activityLogs.teamId,a)),await c.db.delete(d.invitations).where((0,e.eq)(d.invitations.teamId,a)),await c.db.delete(d.teams).where((0,e.eq)(d.teams.id,a)),(0,f.revalidatePath)("/admin/teams"),{success:"Team deleted successfully"}}catch(a){return console.error("Delete team error:",a),{error:a.message||"Failed to delete team"}}}async function v(a,b){try{await p();let a=b.get("id"),f=b.get("gatewayId"),g=f&&"none"!==f?parseInt(f):null,h=parseFloat(b.get("amount")||"0"),i=Math.round(100*h),j={name:b.get("name"),description:b.get("description"),amount:i,currency:b.get("currency")||"usd",interval:b.get("interval"),trialDays:b.get("trialDays"),maxUsers:b.get("maxUsers"),maxContacts:b.get("maxContacts"),maxInstances:b.get("maxInstances"),isAiEnabled:"on"===b.get("isAiEnabled"),isFlowBuilderEnabled:"on"===b.get("isFlowBuilderEnabled"),isCampaignsEnabled:"on"===b.get("isCampaignsEnabled"),isTemplatesEnabled:"on"===b.get("isTemplatesEnabled"),isVoiceCallsEnabled:"on"===b.get("isVoiceCallsEnabled")},k=o.safeParse(j);if(!k.success)return{error:k.error.issues[0].message};let{name:l,description:n,amount:q,currency:r,interval:s}=k.data,t="",u="",v=null,w=null;if(g&&q>0){let b=await c.db.query.paymentGateways.findFirst({where:(0,e.eq)(d.paymentGateways.id,g)});if(b&&"stripe"===b.gateway){let f=new m.StripeAdapter(b.secretKey).stripeClient;if(a){let b=await c.db.query.plans.findFirst({where:(0,e.eq)(d.plans.id,parseInt(a))});if(!b)return{error:"Plan not found"};let g=b.gatewayProductId||b.stripeProductId;if(g){try{await f.products.update(g,{name:l,description:n||void 0})}catch{}v=g}else v=(await f.products.create({name:l,description:n||void 0})).id;w=b.amount===q&&b.interval===s&&b.gatewayPriceId?b.gatewayPriceId:(await f.prices.create({product:v,unit_amount:q,currency:r,recurring:{interval:s}})).id}else{let a=await f.products.create({name:l,description:n||void 0});v=a.id,w=(await f.prices.create({product:a.id,unit_amount:q,currency:r,recurring:{interval:s}})).id}t=v,u=w}else b&&("razorpay"===b.gateway||"offline"===b.gateway)&&(v=null,w=null)}let x={...k.data,gatewayId:g,gatewayProductId:v,gatewayPriceId:w,stripeProductId:t,stripePriceId:u,updatedAt:new Date};a?await c.db.update(d.plans).set(x).where((0,e.eq)(d.plans.id,parseInt(a))):await c.db.insert(d.plans).values(x)}catch(a){return{error:a.message}}(0,f.revalidatePath)("/admin/plans"),(0,h.redirect)("/admin/plans")}async function w(a){try{if(await p(),1===a)return{error:"Cannot delete the default system plan."};if(await c.db.query.teams.findFirst({where:(0,e.eq)(d.teams.planId,a)}))return{error:"Cannot delete this plan because it is assigned to one or more teams."};let b=await c.db.query.plans.findFirst({where:(0,e.eq)(d.plans.id,a)});if(b?.gatewayId&&b?.gatewayProductId)try{let a=await c.db.query.paymentGateways.findFirst({where:(0,e.eq)(d.paymentGateways.id,b.gatewayId)});if(a?.gateway==="stripe"){let c=new m.StripeAdapter(a.secretKey);await c.stripeClient.products.update(b.gatewayProductId,{active:!1})}}catch(a){console.error(a)}return await c.db.delete(d.plans).where((0,e.eq)(d.plans.id,a)),(0,f.revalidatePath)("/admin/plans"),{success:"Plan deleted successfully"}}catch(a){return{error:a.message||"Failed to delete plan"}}}(0,n.ensureServerEntryExports)([q,r,s,t,u,v,w]),(0,b.registerServerReference)(q,"60520ab65cc3cd96dadf439751ea466a228ee26275",null),(0,b.registerServerReference)(r,"405023b8a2fe857357ca224d5574808dcfb20bf492",null),(0,b.registerServerReference)(s,"607d220b0f6679a9c9f8ead8b8b1f59d2e0884e40a",null),(0,b.registerServerReference)(t,"40c6c04b68db4c817fc33dff0fe1a6998a6721f033",null),(0,b.registerServerReference)(u,"4041d1a7792b816cd9c5d5682ff0c8658c68c8001d",null),(0,b.registerServerReference)(v,"60069333157c841d42081060bb11225b9359455610",null),(0,b.registerServerReference)(w,"403496adf76657c9492797cb78bf7e3c3771f7fae7",null),a.s(["adminSendResetLink",0,r,"adminSetPassword",0,s,"deletePlan",0,w,"deleteTeam",0,u,"deleteUser",0,t,"updateUserRole",0,q,"upsertPlan",0,v])},495782,a=>{"use strict";var b=a.i(650585);a.s([],381876),a.i(381876),a.s(["4041d1a7792b816cd9c5d5682ff0c8658c68c8001d",()=>b.deleteTeam],495782)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0xoizb1._.js.map