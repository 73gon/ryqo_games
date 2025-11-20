import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <div className='relative w-full'>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
      <Input
        type='text'
        placeholder={t('homepage.searchPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='pl-10 sm:pl-11 pr-4 py-2 sm:py-3 text-sm sm:text-base bg-card border-border text-foreground placeholder:text-muted-foreground'
      />
    </div>
  );
}
