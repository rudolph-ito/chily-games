ActiveAdmin.register Variant do
  actions :index, :destroy

  index do
    selectable_column
    id_column
    column :user
    actions
  end
end
