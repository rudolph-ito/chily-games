ActiveAdmin.register Quote do
  permit_params :book_name, :book_number, :chapter_name, :chapter_number, :description, :number, :text

  index do
    id_column
    column :book_name
    column :chapter_name
    column :description
    actions
  end
end
