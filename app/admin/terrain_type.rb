ActiveAdmin.register TerrainType do
  permit_params :name, :image

  index do
    id_column
    column :name
    column :image
    actions
  end
end
