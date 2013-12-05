class TerrainTypeAuthorizer < ApplicationAuthorizer
  class << self
    def creatable_by?(user)
      user.admin?
    end
  end

  def managable_by?(user)
    user.admin?
  end
end
