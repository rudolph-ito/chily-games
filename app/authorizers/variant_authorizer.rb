class VariantAuthorizer < ApplicationAuthorizer
  class << self
    def creatable_by?(user)
      true
    end
  end

  def managable_by?(user)
    resource.user_id == user.id
  end
end