import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className='w-full min-h-[60vh] flex items-center justify-center px-4 sm:px-6'>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className='w-full max-w-md'>
        <Card className='border-border bg-card'>
          <CardHeader className='text-center space-y-2'>
            <CardTitle className='text-3xl sm:text-4xl text-foreground'>{t('notFound.title')}</CardTitle>
            <CardDescription className='text-base text-muted-foreground'>{t('notFound.description')}</CardDescription>
          </CardHeader>
          <CardContent className='flex justify-center'>
            <Link to='/'>
              <Button className='gap-2 bg-primary text-primary-foreground hover:bg-primary/90'>
                <Home className='h-4 w-4' />
                {t('notFound.backHome')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
