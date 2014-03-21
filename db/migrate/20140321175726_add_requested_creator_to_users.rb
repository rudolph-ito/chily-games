class AddRequestedCreatorToUsers < ActiveRecord::Migration
  def change
    add_column :users, :requested_creator, :boolean
  end
end
