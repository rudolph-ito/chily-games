class Topic < ActiveRecord::Base
  include Authority::Abilities

  ########################################
  # Relations
  ########################################

  has_many :comments, inverse_of: :topic
  accepts_nested_attributes_for :comments

  belongs_to :parent, polymorphic: true
  belongs_to :user

  ########################################
  # Validations
  ########################################

  validates :parent, :title, presence: true
  validates :title, uniqueness: { scope: [:parent_id, :parent_type] }

  ########################################
  # Callbacks
  ########################################

  before_validation :set_initial_comment_user_id, on: :create

  ########################################
  # Callbacks
  ########################################

  def to_s
    title
  end

  private

  def set_initial_comment_user_id
    comments.first.user_id = self.user_id if comments.first
  end
end
