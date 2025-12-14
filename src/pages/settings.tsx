import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { RotateCcw, Check, CaseUpper, CaseLower, Type } from 'lucide-react';
import { useSettings, type AppSettings } from '@/lib/settings';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings, resetSettings } = useSettings();

  const pageWidthOptions: { value: AppSettings['pageWidth']; label: string }[] = [
    { value: 'narrow', label: t('settings.pageWidth.narrow', 'Narrow') },
    { value: 'medium', label: t('settings.pageWidth.medium', 'Medium') },
    { value: 'wide', label: t('settings.pageWidth.wide', 'Wide') },
    { value: 'full', label: t('settings.pageWidth.full', 'Full Width') },
  ];

  const fontOptions: { value: AppSettings['font']; label: string }[] = [
    { value: 'inter', label: 'Inter' },
    { value: 'mono', label: 'JetBrains Mono' },
    { value: 'serif', label: 'Georgia' },
  ];

  const themeOptions: { value: AppSettings['theme']; label: string; color: string }[] = [
    { value: 'default', label: t('settings.theme.default', 'Default'), color: 'bg-neutral-900 dark:bg-neutral-100' },
    { value: 'blue', label: t('settings.theme.blue', 'Blue'), color: 'bg-blue-600' },
    { value: 'green', label: t('settings.theme.green', 'Green'), color: 'bg-green-600' },
    { value: 'orange', label: t('settings.theme.orange', 'Orange'), color: 'bg-orange-600' },
    { value: 'rose', label: t('settings.theme.rose', 'Rose'), color: 'bg-rose-600' },
    { value: 'purple', label: t('settings.theme.purple', 'Purple'), color: 'bg-purple-600' },
  ];

  return (
    <div className='w-full py-8 px-4 sm:px-6'>
      <motion.div variants={containerVariants} initial='hidden' animate='visible' className='space-y-8 max-w-3xl mx-auto'>
        {/* Header */}
        <motion.div variants={itemVariants} className='flex items-center justify-between pb-6 border-b'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{t('settings.title', 'Settings')}</h1>
            <p className='text-muted-foreground mt-1'>{t('settings.description', 'Customize your experience')}</p>
          </div>
          <Button variant='ghost' size='sm' onClick={resetSettings} className='text-muted-foreground hover:text-foreground'>
            <RotateCcw className='h-4 w-4 mr-2' />
            {t('settings.reset', 'Reset defaults')}
          </Button>
        </motion.div>

        {/* Interface Section */}
        <div className='space-y-6'>
          <motion.h2 variants={itemVariants} className='text-lg font-semibold text-foreground/90'>
            Interface
          </motion.h2>

          {/* Page Width */}
          <motion.div
            variants={itemVariants}
            className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors'
          >
            <div className='space-y-0.5'>
              <label className='text-base font-medium'>{t('settings.pageWidth.title', 'Page Width')}</label>
              <p className='text-sm text-muted-foreground'>{t('settings.pageWidth.description', 'Adjust the content width')}</p>
            </div>
            <div className='w-full sm:w-[200px]'>
              <Select value={settings.pageWidth} onValueChange={(value: AppSettings['pageWidth']) => updateSettings({ pageWidth: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageWidthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Font */}
          <motion.div
            variants={itemVariants}
            className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors'
          >
            <div className='space-y-0.5'>
              <label className='text-base font-medium'>{t('settings.font.title', 'Font Family')}</label>
              <p className='text-sm text-muted-foreground'>{t('settings.font.description', 'Choose your preferred typeface')}</p>
            </div>
            <div className='w-full sm:w-[200px]'>
              <Select value={settings.font} onValueChange={(value: AppSettings['font']) => updateSettings({ font: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span
                        className={cn(
                          option.value === 'inter' && 'font-sans',
                          option.value === 'mono' && 'font-mono',
                          option.value === 'serif' && 'font-serif',
                        )}
                      >
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Text Case */}
          <motion.div
            variants={itemVariants}
            className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors'
          >
            <div className='space-y-0.5'>
              <label className='text-base font-medium'>Text Case</label>
              <p className='text-sm text-muted-foreground'>Choose your preferred text capitalization</p>
            </div>
            <div>
              <ToggleGroup
                type='single'
                variant='outline'
                value={settings.textCase}
                onValueChange={(value) => {
                  if (value) updateSettings({ textCase: value as AppSettings['textCase'] });
                }}
              >
                <ToggleGroupItem value='normal' aria-label='Normal case'>
                  <Type className='h-4 w-4' />
                </ToggleGroupItem>
                <ToggleGroupItem value='lowercase' aria-label='Lowercase'>
                  <CaseLower className='h-4 w-4' />
                </ToggleGroupItem>
                <ToggleGroupItem value='uppercase' aria-label='Uppercase'>
                  <CaseUpper className='h-4 w-4' />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </motion.div>
        </div>

        {/* Appearance Section */}
        <div className='space-y-6 pt-6'>
          <motion.h2 variants={itemVariants} className='text-lg font-semibold text-foreground/90'>
            Appearance
          </motion.h2>

          {/* Theme */}
          <motion.div variants={itemVariants} className='space-y-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors'>
            <div className='space-y-0.5'>
              <label className='text-base font-medium'>{t('settings.theme.title', 'Accent Color')}</label>
              <p className='text-sm text-muted-foreground'>{t('settings.theme.description', 'Select an accent color for the interface')}</p>
            </div>

            <div className='flex flex-wrap gap-3 pt-2'>
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSettings({ theme: option.value })}
                  className={cn(
                    'group relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    settings.theme === option.value
                      ? 'border-foreground ring-2 ring-offset-2 ring-primary'
                      : 'border-transparent opacity-80 hover:opacity-100',
                    option.color,
                  )}
                  title={option.label}
                >
                  {settings.theme === option.value && <Check className='w-5 h-5 text-white mix-blend-difference' strokeWidth={3} />}
                  <span className='sr-only'>{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
