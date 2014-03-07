ActiveAdmin.register Discussion do
  permit_params :title, :description

  index do
    id_column
    column :title
    column :description
  end
end
