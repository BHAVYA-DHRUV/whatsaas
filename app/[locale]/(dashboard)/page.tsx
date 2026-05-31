// import Link from 'next/link';
// import { getTranslations } from 'next-intl/server';

// export default async function HomePage() {
//   const t = await getTranslations('LandingPage');

//   return (
//     <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
//       <span className="mb-6 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
//         {t('hero.badge')}
//       </span>

//       <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
//         {t('hero.title_part1')}{' '}
//         <span className="text-transparent bg-linear-to-r from-primary to-purple-600 bg-clip-text">
//           {t('hero.title_part2')}
//         </span>
//       </h1>

//       <p className="max-w-2xl mt-6 text-lg text-muted-foreground md:text-xl">
//         {t('hero.subtitle')}
//       </p>

//       <div className="flex flex-col gap-4 mt-10 sm:flex-row">
//         <Link href="/sign-up" className="inline-flex items-center px-8 py-3 text-base font-semibold transition rounded-full shadow-lg bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90">
//           {t('hero.cta_primary')} <span aria-hidden="true" className="ml-2">→</span>
//         </Link>
//         <Link href="/docs" className="inline-flex items-center px-8 py-3 text-base font-semibold transition border rounded-full border-border bg-background text-foreground hover:bg-muted">
//           {t('hero.cta_secondary')}
//         </Link>
//       </div>
//     </main>
//   );
// }

import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Zap, 
  Users, 
  BarChart3, 
  Smartphone,
  Bot,
  Search,
  MoreVertical,
  Paperclip,
  Send,
  LayoutDashboard,
  Settings,
  Phone,
  Inbox,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPublishedPlans } from '@/lib/db/queries';
import { getBranding } from '@/lib/db/queries/branding';
import Logo from '@/components/interface/Logo';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server'; 




function DashboardPreview() {
  const t = useTranslations('LandingPage.preview');

  return (
    <div className="relative w-full max-w-6xl mx-auto duration-1000 delay-200 animate-in fade-in slide-in-from-bottom-8">
      <div className="relative overflow-hidden border shadow-2xl rounded-2xl border-border/60 bg-background ring-1 ring-white/10">
        
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/40 backdrop-blur-md">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="h-6 w-1/3 rounded-md bg-background/50 border border-border/30 text-[10px] flex items-center justify-center text-muted-foreground font-mono">
            {t('url_bar')}
          </div>
          <div className="w-10" />
        </div>

        <div className="flex h-150background">
          
          <div className="w-17.5order-r border-border/40 flex flex-col items-center py-6 gap-6 bg-card/50">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary">
              <Logo showName={false} />
            </div>
            <div className="flex flex-col w-full gap-4 px-3 mt-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary"><Inbox className="w-5 h-5" /></div>
              <div className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg hover:bg-muted text-muted-foreground"><LayoutDashboard className="w-5 h-5" /></div>
              <div className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg hover:bg-muted text-muted-foreground"><Users className="w-5 h-5" /></div>
              <div className="flex items-center justify-center w-10 h-10 transition-colors rounded-lg hover:bg-muted text-muted-foreground"><Zap className="w-5 h-5" /></div>
            </div>
            <div className="w-10 h-10 mt-auto border rounded-full bg-muted border-border" />
          </div>

          <div className="flex flex-col border-r w-80 border-border/40 bg-background/50 backdrop-blur-sm md:flex">
            <div className="p-4 border-b border-border/40">
              <h2 className="mb-4 text-lg font-semibold">{t('inbox_title')}</h2>
              <div className="relative">
                <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                <div className="flex items-center w-full h-10 text-sm border rounded-lg border-border bg-muted/30 pl-9 text-muted-foreground">{t('search_placeholder')}</div>
              </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-hidden">
              {[
                { name: "Alice Freeman", msg: t('chat_1_msg'), time: "10:23 AM", active: true, unread: 0 },
                { name: "Tech Solutions", msg: t('chat_2_msg'), time: "09:45 AM", active: false, unread: 2 },
                { name: "John Doe", msg: t('chat_3_msg'), time: "Yesterday", active: false, unread: 0 },
                { name: "Sarah Smith", msg: t('chat_4_msg'), time: "Yesterday", active: false, unread: 0 },
              ].map((chat, i) => (
                <div key={i} className={`p-3 rounded-xl flex gap-3 cursor-default ${chat.active ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50 border border-transparent'}`}>
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${chat.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {chat.name.substring(0, 2).toUpperCase()}
                    </div>
                    {chat.active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full border-background"></div>}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{chat.name}</span>
                      <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs truncate text-muted-foreground max-w-30">{chat.msg}</span>
                      {chat.unread > 0 && <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">{chat.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col flex-1 bg-background">
            <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center text-xs font-bold rounded-full h-9 w-9 bg-primary text-primary-foreground">AF</div>
                <div>
                  <h3 className="text-sm font-semibold">Alice Freeman</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">{t('status_online')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted"><Phone className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted"><MoreVertical className="w-4 h-4 text-muted-foreground" /></div>
              </div>
            </div>

            <div className="relative flex-1 p-6 space-y-6 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.03] dark:opacity-[0.05]"></div>
              
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm text-foreground shadow-sm">
                  {t('demo_msg_1')}
                  <span className="block text-[10px] text-muted-foreground mt-1 text-right">10:20 AM</span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm text-foreground shadow-sm">
                  {t('demo_msg_2')}
                  <span className="block text-[10px] text-muted-foreground mt-1 text-right">10:21 AM</span>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm shadow-sm relative group">
                  <div className="flex items-center gap-1.5 mb-2 text-primary font-medium text-xs uppercase tracking-wide">
                    <Bot className="w-3 h-3" /> {t('ai_badge')}
                  </div>
                  {t('demo_ai_response')}
                  <span className="block text-[10px] text-primary/60 mt-1 text-right">10:21 AM</span>
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm text-foreground shadow-sm">
                  {t('demo_msg_3')}
                  <span className="block text-[10px] text-muted-foreground mt-1 text-right">10:23 AM</span>
                </div>
              </div>

              <div className="flex justify-center py-2">
                 <Badge variant="outline" className="text-xs font-normal shadow-sm bg-background/80 backdrop-blur text-muted-foreground">
                    {t('ai_typing')}
                 </Badge>
              </div>
            </div>

            <div className="p-4 border-t border-border/40 bg-background">
              <div className="flex items-center gap-3 p-2 border bg-muted/30 rounded-xl border-border/50">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary"><Plus className="w-5 h-5" /></Button>
                <div className="w-px h-6 bg-border" />
                <input className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground" placeholder="Type a message or / for commands..." />
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary"><Paperclip className="w-4 h-4" /></Button>
                <Button size="icon" className="w-8 h-8 rounded-lg"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>

          <div className="hidden p-5 border-l w-72 border-border/40 bg-muted/5 lg:block">
             <div className="flex flex-col items-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 mb-3 text-2xl font-bold rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-primary">AF</div>
                <h3 className="text-lg font-bold">Alice Freeman</h3>
                <p className="text-sm text-muted-foreground">+1 (555) 012-3456</p>
             </div>

             <div className="space-y-6">
                <div>
                    <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-muted-foreground">{t('crm_funnel')}</h4>
                    <div className="flex items-center gap-2 p-3 border rounded-lg shadow-sm bg-background border-border">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span className="text-sm font-medium">{t('crm_stage_negotiation')}</span>
                    </div>
                </div>

                <div>
                    <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-muted-foreground">{t('crm_tags')}</h4>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">{t('crm_tag_hot')}</Badge>
                        <Badge variant="secondary" className="text-purple-700 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">{t('crm_tag_api')}</Badge>
                    </div>
                </div>

                <div>
                    <h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-muted-foreground">{t('crm_actions')}</h4>
                    <div className="space-y-2">
                        <Button variant="outline" className="justify-start w-full text-sm h-9"><Settings className="w-4 h-4 mr-2" /> {t('crm_action_assign')}</Button>
                        <Button variant="outline" className="justify-start w-full text-sm h-9"><Bot className="w-4 h-4 mr-2" /> {t('crm_action_pause')}</Button>
                    </div>
                </div>
             </div>
          </div>

        </div>
      </div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-[100px] -z-10 rounded-[50%]" />
    </div>
  );
}

function LogoCarousel() {
  const t = useTranslations('LandingPage.social_proof');
  const logos = ["TechCorp", "SalesFlow", "AutoChat", "MarketUp", "GrowFast", "NextLevel"];
  return (
    <div className="w-full py-12 overflow-hidden border-y border-border/40 bg-muted/20">
      <div className="px-6 mx-auto max-w-7xl">
        <p className="mb-8 text-sm font-medium tracking-widest text-center uppercase text-muted-foreground">
          {t('trusted_by')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 transition-all duration-500 opacity-50 md:gap-20 grayscale hover:grayscale-0 md:flex-nowrap">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center gap-2 font-mono text-xl font-bold tracking-tighter select-none">
               <div className="w-6 h-6 rounded-md bg-foreground opacity-20"></div>
               {logo}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: string }) {
  return (
    <div className={`group p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${delay}`}>
      <div className="flex items-center justify-center w-12 h-12 mb-4 transition-colors rounded-lg bg-primary/5 group-hover:bg-primary/10">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}



export default async function HomePage() {
  
  const t = await getTranslations('LandingPage');

  const [plansResult, brandingResult] = await Promise.allSettled([
    getPublishedPlans(),
    getBranding(),
  ]);

  const plans = plansResult.status === 'fulfilled' ? plansResult.value : [];
  const branding = brandingResult.status === 'fulfilled' ? brandingResult.value : null;
  const siteName = branding?.name || 'WhatSaaS';

  return (
    <main className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        
        <div className="relative z-10 px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full text-sm border-primary/20 bg-primary/5 text-primary font-medium animate-in fade-in zoom-in duration-500">
            {t('hero.badge')}
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 leading-[1.1]">
            {t('hero.title_part1')} <br className="hidden md:block" />
            <span className="text-transparent bg-linear-to-r from-primary to-purple-600 bg-clip-text">
              {t('hero.title_part2')}
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto mb-10 text-xl leading-relaxed duration-700 delay-100 text-muted-foreground animate-in fade-in slide-in-from-bottom-4">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 mb-24 duration-700 delay-200 sm:flex-row animate-in fade-in slide-in-from-bottom-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 text-base transition-all rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40">
                {t('hero.cta_primary')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-full backdrop-blur-sm bg-background/50">
                {t('hero.cta_secondary')}
              </Button>
            </Link>
          </div>

          <DashboardPreview />
        </div>
      </section>

      <LogoCarousel />

      <section id="features" className="relative py-24 bg-background">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('features.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={Zap} 
              title={t('features.card_flow_title')} 
              description={t('features.card_flow_desc')} 
              delay="delay-0"
            />
            <FeatureCard 
              icon={Bot} 
              title={t('features.card_ai_title')} 
              description={t('features.card_ai_desc')} 
              delay="delay-100"
            />
            <FeatureCard 
              icon={MessageSquare} 
              title={t('features.card_inbox_title')} 
              description={t('features.card_inbox_desc')} 
              delay="delay-200"
            />
            <FeatureCard 
              icon={Smartphone} 
              title={t('features.card_multi_title')} 
              description={t('features.card_multi_desc')} 
              delay="delay-300"
            />
            <FeatureCard 
              icon={Users} 
              title={t('features.card_team_title')} 
              description={t('features.card_team_desc')} 
              delay="delay-400"
            />
            <FeatureCard 
              icon={BarChart3} 
              title={t('features.card_campaigns_title')} 
              description={t('features.card_campaigns_desc')} 
              delay="delay-500"
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 border-t bg-muted/30 border-border">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('pricing.title')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan, index) => {
              const isPopular = index === 1;
              const formatLimit = (value: number) => value === -1 ? 'Unlimited' : value.toLocaleString();
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col p-8 rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl ${isPopular ? 'border-primary shadow-lg shadow-primary/10 scale-105 z-10' : 'border-border'}`}
                >
                  {isPopular && (
                    <div className="absolute px-3 py-1 text-xs font-bold -translate-x-1/2 rounded-full shadow-sm -top-4 left-1/2 bg-primary text-primary-foreground">
                      {t('pricing.most_popular')}
                    </div>
                  )}
                  <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">${plan.amount / 100}</span>
                    <span className="text-muted-foreground">/{plan.interval === 'month' ? t('pricing.interval_month') : t('pricing.interval_year')}</span>
                  </div>
                  <p className="mb-6 text-sm text-muted-foreground min-h-10">{plan.description || "Perfect for getting started."}</p>

                  <ul className="flex-1 mb-8 space-y-3">
                    <li className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {t('pricing.features.users', {count: formatLimit(plan.maxUsers)})}
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {t('pricing.features.connections', {count: formatLimit(plan.maxInstances)})}
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {t('pricing.features.contacts', {count: formatLimit(plan.maxContacts)})}
                    </li>
                    {plan.isAiEnabled && (
                        <li className="flex items-center gap-3 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {t('pricing.features.ai')}
                        </li>
                    )}
                    {plan.isFlowBuilderEnabled && (
                        <li className="flex items-center gap-3 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {t('pricing.features.flow')}
                        </li>
                    )}
                  </ul>

                  <Link href={`/sign-up?priceId=${plan.stripePriceId}`}>
                    <Button 
                        className={`w-full rounded-full h-11 text-sm font-semibold ${isPopular ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
                    >
                      {t('pricing.get_started')}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-4xl px-4 mx-auto text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
            {t('cta_final.title')}
          </h2>
          <p className="mb-10 text-xl text-muted-foreground">
            {t('cta_final.subtitle')}
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="px-10 text-lg rounded-full shadow-xl h-14 shadow-primary/20">
              {t('cta_final.button')}
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">{t('cta_final.disclaimer')}</p>
        </div>
      </section>

      <footer className="py-12 border-t border-border bg-muted/10">
        <div className="flex flex-col items-center justify-between gap-6 px-6 mx-auto max-w-7xl md:flex-row">
          <Logo />
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="/terms" className="transition-colors hover:text-foreground">{t('footer.terms')}</Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">{t('footer.privacy')}</Link>
            <Link href="/docs" className="transition-colors hover:text-foreground">{t('footer.docs')}</Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">{t('footer.contact')}</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. {t('footer.rights')}
          </p>
        </div>
      </footer>
    </main>
  );
}