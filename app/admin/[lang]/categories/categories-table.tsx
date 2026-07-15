'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import type { Category } from './columns';

interface CategoriesTableProps {
  categories: Category[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const t = useTranslations('admin');

  return (
    <DataTable
      columns={createColumns(t)}
      data={categories}
      filterPlaceholder={t('searchCategories')}
    />
  );
}

export default CategoriesTable;
