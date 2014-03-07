ActiveAdmin.register PieceType do
  permit_params :name, :alabaster_image, :onyx_image

  index do
    id_column
    column :name
    column :alabaster_image
    column :onyx_image
    actions
  end
end
