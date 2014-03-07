ActiveAdmin.register User do
  permit_params :username, :email, :password, :password_confirmation, :creator

  index do
    id_column
    column :username
    column :email
    column :creator
    column :created_at
    column :sign_in_count
    column :current_sign_in_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :username
      f.input :email

      if f.object.new_record?
        f.input :password
        f.input :password_confirmation
      end

      f.input :creator
    end
    f.actions
  end
end
