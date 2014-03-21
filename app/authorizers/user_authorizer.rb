class UserAuthorizer < ApplicationAuthorizer

  def readable_by?(user)
    resource.id == user.id
  end

  def managable_by?(user)
    resource.id == user.id
  end

end