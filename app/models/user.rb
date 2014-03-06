class User < ActiveRecord::Base
  include Authority::Abilities
  include Authority::UserAbilities

  ########################################
  # Relations
  ########################################

  has_many :variants

  ########################################
  # Validations
  ########################################

  validates :username, presence: true, uniqueness: { :case_sensitive => false }

  ########################################
  # Devise
  ########################################

  attr_accessor :login

  devise \
    :database_authenticatable,
    :lockable,
    :registerable,
    :recoverable,
    :rememberable,
    :trackable,
    :validatable

  # Function to handle user's login via email or username
  def self.find_first_by_auth_conditions(warden_conditions)
    conditions = warden_conditions.dup
    login = conditions.delete(:login) || ""
    where(conditions).where(["lower(username) = :value OR lower(email) = :value", { :value => login.downcase }]).first
  end

  ########################################
  # Instance Methods
  ########################################

  def to_s
    username
  end

end
