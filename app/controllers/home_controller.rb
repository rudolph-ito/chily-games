class HomeController < ApplicationController
  before_filter :authenticate_user!, only: [:request_creator]

  def index
    @dragon_image_src = PieceType.find_by(name: 'Dragon').try(:alabaster_image)
    @king_image_src = PieceType.find_by(name: 'King').try(:onyx_image)
  end

  def invariants
  end

  def creator
  end

  def request_creator
    current_user.update_attributes(requested_creator: true)
    redirect_to :creator
  end

end
