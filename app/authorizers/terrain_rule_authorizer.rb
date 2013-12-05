class TerrainRuleAuthorizer < ApplicationAuthorizer
  def creatable_by?(user)
    resource.variant.managable_by?(user)
  end

  def managable_by?(user)
    resource.variant.managable_by?(user)
  end
end