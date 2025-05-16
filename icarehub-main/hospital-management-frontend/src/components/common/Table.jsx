import React from 'react';
import './Table.css'; 

const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
}) => {
  const handleRowClick = (row, index) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  const handleCheckboxChange = (event, row, index) => {
    event.stopPropagation();
    if (onSelectRow) {
      onSelectRow(row, index);
    }
  };

  const handleSelectAll = (event) => {
    if (onSelectAll) {
      onSelectAll(event.target.checked);
    }
  };

  const isRowSelected = (row) => {
    return selectedRows.some((selectedRow) => selectedRow.id === row.id);
  };

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {selectable && (
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedRows.length === data.length}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width, textAlign: column.align || 'left' }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="loading">
                <div className="loading-spinner" />
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => handleRowClick(row, rowIndex)}
                className={`${onRowClick ? 'clickable' : ''} ${
                  isRowSelected(row) ? 'selected' : ''
                }`}
              >
                {selectable && (
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={isRowSelected(row)}
                      onChange={(e) => handleCheckboxChange(e, row, rowIndex)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      
    </div>
  );
};

export default Table;