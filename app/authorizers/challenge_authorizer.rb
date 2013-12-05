class ChallengeAuthorizer < ApplicationAuthorizer
  class << self
    def creatable_by?(user)
      true
    end
  end

  def acceptable_by?(user)
    resource.challenged_id == user.id ||
      (resource.challenged_id.blank? && resource.challenger_id != user.id)
  end

  def declinable_by?(user)
    resource.challenged_id == user.id
  end

  def deletable_by?(user)
    resource.challenger_id == user.id
  end
end