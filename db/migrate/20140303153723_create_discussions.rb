class CreateDiscussions < ActiveRecord::Migration
  def change
    create_table :comments do |t|
      t.text :text
      t.integer :topic_id
      t.integer :user_id

      t.datetime :created_at
      t.datetime :updated_at
    end

    create_table :discussions do |t|
      t.string :title
      t.text :description
    end

    create_table :topics do |t|
      t.string :title
      t.integer :parent_id
      t.string :parent_type
      t.integer :user_id

      t.integer :comments_count

      t.datetime :created_at
    end
  end
end
