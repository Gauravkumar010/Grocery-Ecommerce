// src/components/admin/DataTable.jsx

const DataTable = ({ columns, data, loading, emptyMessage = 'No records found' }) => {
  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-800">
            {columns.map((col) => (
              <th key={col.key} className="pb-3 pr-4 font-medium whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row._id || idx}
              className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 pr-4">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;