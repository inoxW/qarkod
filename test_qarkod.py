from qarkod import make_matrix, to_svg


def test_matrix_has_finder_patterns():
    matrix = make_matrix("hello")
    assert len(matrix) >= 21
    assert all(len(row) == len(matrix) for row in matrix)
    assert matrix[0][0] == 1
    assert matrix[3][3] == 1


def test_svg_is_valid_enough():
    svg = to_svg(make_matrix("Qarkod"))
    assert svg.startswith("<svg")
    assert 'aria-label="Qarkod"' in svg
