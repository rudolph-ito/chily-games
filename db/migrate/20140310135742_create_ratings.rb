class CreateRatings < ActiveRecord::Migration
  def change
    create_table :ratings do |t|
      t.float :value
      t.integer :variant_id
      t.integer :user_id
    end
  end
end
