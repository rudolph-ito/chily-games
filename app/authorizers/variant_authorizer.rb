class VariantAuthorizer < ApplicationAuthorizer
  class << self
    def creatable_by?(user)
      user.creator && user.variants.empty?
    end
  end

  def managable_by?(user)
    resource.user_id == user.id
  end
end