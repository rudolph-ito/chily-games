class RemoveNameFromVariants < ActiveRecord::Migration
  def change
    remove_column :variants, :name
    add_index :variants, :user_id, unique: true
  end
end
