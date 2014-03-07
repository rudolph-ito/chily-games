class UserAuthorizer < ApplicationAuthorizer

  def managable_by?(user)
    resource.id == user.id
  end

end