import { Center, Pagination, Table } from '@mantine/core';
import { usePagination } from '~/hooks/usePagination';

export interface Props<T> {
   items: T[];
   isLoading?: boolean;
   header: () => React.ReactNode;
   rows: (item: T) => React.ReactNode;
}

const PaginatedTable = <T,>({ items, header, rows }: Props<T>) => {
   const pagination = usePagination(items.length ?? 0);

   const displayItems = items.slice(
      (pagination.data.page - 1) * pagination.data.pageSize,
      pagination.data.page * pagination.data.pageSize,
   );

   return (
      <>
         <Table>
            <thead>{header()}</thead>
            <tbody>{displayItems.map(rows)}</tbody>
         </Table>
         <Center mt={'md'}>
            <Pagination
               page={pagination.data.page}
               total={pagination.pages}
               onChange={(page) => pagination.setPage(page)}
            />
            <br />
         </Center>
      </>
   );
};

export default PaginatedTable;
