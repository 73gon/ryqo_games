import { Plus, Save, Trash2, Edit, Mail, Info, Package, Code, Palette, Route as RouteIcon, Database, FileCheck, Globe, Wrench, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ModeToggle } from '@/components/ui/darkmode';
import { toast } from '@/components/ui/toast';

export function Home() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const dependencies = {
    core: [
      { name: 'React 19', icon: Code },
      { name: 'TypeScript', icon: Code },
      { name: 'Vite', icon: Sparkles },
      { name: 'pnpm', icon: Package },
    ],
    ui: [
      { name: 'Tailwind CSS', icon: Palette },
      { name: 'Radix UI', icon: Palette },
      { name: 'shadcn/ui', icon: Palette },
      { name: 'Lucide React', icon: Sparkles },
      { name: 'Framer Motion', icon: Sparkles },
      { name: 'next-themes', icon: Palette },
    ],
    routing: [{ name: 'TanStack Router', icon: RouteIcon }],
    state: [{ name: 'Zustand', icon: Database }],
    forms: [
      { name: 'React Hook Form', icon: FileCheck },
      { name: 'Zod', icon: FileCheck },
    ],
    http: [{ name: 'Axios', icon: Globe }],
    i18n: [{ name: 'i18next', icon: Globe }],
    dev: [{ name: 'ESLint', icon: Wrench }],
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8 max-w-6xl'>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className='flex justify-between items-center mb-12'>
          <div>
            <h1 className='text-4xl font-bold mb-2'>{t('title')}</h1>
            <p className='text-muted-foreground'>{t('subtitle')}</p>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className='mb-12 p-6 rounded-lg border bg-card'>
          <p className='text-lg leading-relaxed'>{t('description')}</p>
        </motion.div>

        <motion.div variants={container} initial='hidden' animate='show' className='space-y-12'>
          {/* Dark Mode Section */}
          <motion.section variants={item} className='p-6 rounded-lg border bg-card'>
            <h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
              <Palette className='size-6' />
              {t('darkMode.title')}
            </h2>
            <p className='text-muted-foreground mb-4'>{t('darkMode.description')}</p>
            <div className='flex gap-4'>
              <ModeToggle />
            </div>
          </motion.section>

          {/* Translation Section */}
          <motion.section variants={item} className='p-6 rounded-lg border bg-card'>
            <h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
              <Globe className='size-6' />
              {t('translation.title')}
            </h2>
            <p className='text-muted-foreground mb-4'>{t('translation.description')}</p>
            <div className='flex gap-4 items-center'>
              <span className='text-sm font-medium'>{t('translation.selectLanguage')}:</span>
              <Select value={i18n.language} onValueChange={changeLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='en'>🇬🇧 English</SelectItem>
                  <SelectItem value='de'>🇩🇪 Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.section>

          {/* Components Section */}
          <motion.section variants={item} className='p-6 rounded-lg border bg-card'>
            <h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
              <Package className='size-6' />
              {t('components.title')}
            </h2>
            <p className='text-muted-foreground mb-6'>{t('components.description')}</p>

            <div className='space-y-8'>
              {/* Buttons */}
              <div>
                <h3 className='text-xl font-semibold mb-4'>{t('components.button.title')}</h3>
                <div className='space-y-4'>
                  <div>
                    <p className='text-sm font-medium mb-2'>{t('components.button.variants')}</p>
                    <div className='flex flex-wrap gap-3'>
                      <Button variant='default'>{t('components.button.default')}</Button>
                      <Button variant='destructive'>{t('components.button.destructive')}</Button>
                      <Button variant='outline'>{t('components.button.outline')}</Button>
                      <Button variant='secondary'>{t('components.button.secondary')}</Button>
                      <Button variant='ghost'>{t('components.button.ghost')}</Button>
                      <Button variant='link'>{t('components.button.link')}</Button>
                    </div>
                  </div>
                  <div>
                    <p className='text-sm font-medium mb-2'>{t('components.button.sizes')}</p>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Button size='sm'>{t('components.button.small')}</Button>
                      <Button size='default'>{t('components.button.default')}</Button>
                      <Button size='lg'>{t('components.button.large')}</Button>
                      <Button size='icon'>
                        <Plus />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className='text-sm font-medium mb-2'>{t('components.button.icon')}:</p>
                    <div className='flex flex-wrap gap-3'>
                      <Button>
                        <Save />
                        {t('components.button.icon')}
                      </Button>
                      <Button variant='outline'>
                        <Edit />
                        {t('components.button.icon')}
                      </Button>
                      <Button variant='destructive'>
                        <Trash2 />
                        {t('components.button.icon')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div>
                <h3 className='text-xl font-semibold mb-4'>{t('components.input.title')}</h3>
                <div className='space-y-3 max-w-md'>
                  <Input placeholder={t('components.input.placeholder')} />
                  <div className='grid w-full items-center gap-1.5'>
                    <label className='text-sm font-medium'>{t('components.input.email')}</label>
                    <Input type='email' placeholder={t('components.input.emailPlaceholder')} />
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <h3 className='text-xl font-semibold mb-4'>{t('components.textarea.title')}</h3>
                <div className='max-w-md'>
                  <Textarea placeholder={t('components.textarea.placeholder')} />
                </div>
              </div>

              {/* Select */}
              <div>
                <h3 className='text-xl font-semibold mb-4'>{t('components.select.title')}</h3>
                <div className='max-w-md'>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t('components.select.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1'>{t('components.select.option1')}</SelectItem>
                      <SelectItem value='2'>{t('components.select.option2')}</SelectItem>
                      <SelectItem value='3'>{t('components.select.option3')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tooltip */}
              <div>
                <h3 className='text-xl font-semibold mb-4'>{t('components.tooltip.title')}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='outline'>
                      <Info />
                      {t('components.tooltip.hover')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('components.tooltip.message')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Toast */}
              <div>
                <h3 className='text-xl font-semibold mb-4'>{t('components.toast.title')}</h3>
                <Button
                  onClick={() =>
                    toast.info(t('components.toast.message'), {
                      description: t('components.toast.description'),
                    })
                  }
                >
                  <Mail />
                  {t('components.toast.trigger')}
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Dependencies Section */}
          <motion.section variants={item} className='p-6 rounded-lg border bg-card'>
            <h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
              <Code className='size-6' />
              {t('dependencies.title')}
            </h2>
            <p className='text-muted-foreground mb-6'>{t('dependencies.description')}</p>

            <div className='grid gap-6 md:grid-cols-2'>
              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Code className='size-5' />
                  {t('dependencies.core')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.core.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Palette className='size-5' />
                  {t('dependencies.ui')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.ui.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <RouteIcon className='size-5' />
                  {t('dependencies.routing')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.routing.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Database className='size-5' />
                  {t('dependencies.stateManagement')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.state.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <FileCheck className='size-5' />
                  {t('dependencies.forms')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.forms.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Globe className='size-5' />
                  {t('dependencies.http')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.http.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Sparkles className='size-5' />
                  {t('dependencies.animation')}
                </h3>
                <ul className='space-y-2'>
                  <li className='flex items-center gap-2 text-sm'>
                    <Sparkles className='size-4 text-primary' />
                    <span>Framer Motion</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Globe className='size-5' />
                  {t('dependencies.i18n')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.i18n.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className='text-lg font-semibold mb-3 flex items-center gap-2'>
                  <Wrench className='size-5' />
                  {t('dependencies.devTools')}
                </h3>
                <ul className='space-y-2'>
                  {dependencies.dev.map((dep) => (
                    <li key={dep.name} className='flex items-center gap-2 text-sm'>
                      <dep.icon className='size-4 text-primary' />
                      <span>{dep.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>
        </motion.div>

        {/* Footer */}
        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className='mt-12 pt-8 border-t text-center text-sm text-muted-foreground'>
          <p>Built with ❤️ using modern web technologies</p>
        </motion.footer>
      </div>
    </div>
  );
}
